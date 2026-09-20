
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { users as mockUsers, User } from '@/lib/data';
import emailjs from '@emailjs/browser';
import { getClientRateLimiter } from '@/lib/client-rate-limiter';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

type UserWithPassword = User & { password?: string };

// ---------------------------------------------------------------------------
// Admin account definition (Client-safe: password never stored on client)
// ---------------------------------------------------------------------------
const ADMIN_ACCOUNT: User = {
  id: 'admin-001',
  name: 'Admin',
  username: 'admin',
  role: 'admin',
  email: 'admin@professionhunter.com',
  country: 'Saudi Arabia',
  city: 'Riyadh',
  age: 30,
  phone: '+966500000000',
  avatarUrl: 'https://placehold.co/100x100.png?text=A',
  lastSeen: 'online',
  phoneVerified: true,
};

// ---------------------------------------------------------------------------
// EmailJS credentials from environment variables (never hardcoded)
// ---------------------------------------------------------------------------
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? '';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? '';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User | null | { rateLimited: true; message: string }>;
  logout: () => void;
  signup: (newUser: User, password: string) => Promise<User | null | { rateLimited: true; message: string }>;
  updateUser: (updatedUser: User) => void;
  subscribeUser: (amount: string, method: string) => void;
  subscribeSeeker: (amount: string, method: string) => void;
  requestPasswordReset: (identifier: string) => Promise<string | null>;
  resetPassword: (identifier: string, newPassword: string) => boolean;
  // Admin functions
  getAllUsers: () => User[];
  grantSubscription: (workerId: string, durationDays: number) => void;
  revokeSubscription: (workerId: string) => void;
  updateIqamaStatus: (workerId: string, status: 'approved' | 'rejected', reason?: string) => void;
  submitIqama: (iqamaNumber: string, iqamaImageUrl: string, iqamaBackImageUrl: string) => void;
  setPhoneVerified: (verified?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Helper function to update a user in the main users array and save to Firestore
  const updateAllUsers = async (updatedUser: Partial<UserWithPassword>) => {
    try {
      await setDoc(doc(db, 'users', updatedUser.id as string), updatedUser, { merge: true });
    } catch (error) {
      console.error('[auth] Failed to update user in Firestore:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    // 1. Listen to Firebase users collection and sanitize on arrival
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        let fetchedUsers: User[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const { password: _p, ...sanitized } = data;
          fetchedUsers.push(sanitized as User);
        });

        // 2. If the collection is empty, seed it with mock users without passwords
        if (fetchedUsers.length === 0) {
          const seedUsers = [...mockUsers, ADMIN_ACCOUNT];
          seedUsers.forEach(async (u) => {
            try {
              await setDoc(doc(db, 'users', u.id), u);
            } catch (e) {
              console.warn('[auth] Could not seed user offline:', e);
            }
          });
          fetchedUsers = seedUsers;
        } else {
          // Ensure admin account exists in list
          if (!fetchedUsers.some(u => u.id === ADMIN_ACCOUNT.id)) {
            fetchedUsers.push(ADMIN_ACCOUNT);
          }
        }

        setUsers(fetchedUsers);

        // 3. Update active session user if they are logged in
        try {
          const storedUserStr = localStorage.getItem('handy-connect-user');
          if (storedUserStr) {
            let parsedUser: User = JSON.parse(storedUserStr);
            let fullUser = fetchedUsers.find(u => u.id === parsedUser.id) || parsedUser;

            // Check worker subscription status
            if (fullUser.role === 'worker' && fullUser.subscriptionEndDate) {
              if (new Date(fullUser.subscriptionEndDate) < new Date()) {
                fullUser = { ...fullUser, isPro: false, subscriptionEndDate: undefined };
              }
            }

            // Check seeker subscription status
            if (fullUser.role === 'seeker' && fullUser.seekerSubscriptionEndDate) {
              if (new Date(fullUser.seekerSubscriptionEndDate) < new Date()) {
                fullUser = { ...fullUser, isSeekerPro: false, seekerSubscriptionEndDate: undefined };
              }
            }

            // Persist any changes from expiration checks
            if (
              fullUser.isPro !== parsedUser.isPro ||
              fullUser.isSeekerPro !== parsedUser.isSeekerPro ||
              fullUser.subscriptionEndDate !== parsedUser.subscriptionEndDate ||
              fullUser.seekerSubscriptionEndDate !== parsedUser.seekerSubscriptionEndDate
            ) {
              setDoc(doc(db, 'users', fullUser.id), fullUser, { merge: true }).catch(e => console.warn('[auth] Offline:', e));
            }

            localStorage.setItem('handy-connect-user', JSON.stringify(fullUser));
            setUser(fullUser);
          }
        } catch (error) {
          console.warn('[auth] Failed to initialise user:', error);
          localStorage.removeItem('handy-connect-user');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.warn('[auth] Firestore onSnapshot unreachable/offline. Using local state fallback:', error?.message);
        // Fallback to local storage user session when Firebase is offline
        try {
          const storedUserStr = localStorage.getItem('handy-connect-user');
          if (storedUserStr) {
            setUser(JSON.parse(storedUserStr));
          } else {
            setUser(null);
          }
        } catch (e) {
          console.warn('[auth] Failed parsing local user state:', e);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = async (identifier: string, password: string): Promise<User | null | { rateLimited: true; message: string }> => {
    const rl = getClientRateLimiter();

    // Per-identifier rate limit check (combines IP fingerprint + account)
    const check = rl.check('auth', identifier);
    if (!check.allowed) {
      return { rateLimited: true, message: check.message ?? 'Too many attempts. Please try again later.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          return { rateLimited: true, message: data.error ?? 'Too many attempts. Please try again later.' };
        }
        rl.onFailure('auth', identifier);
        return null;
      }

      const data = await res.json();
      if (data.success && data.user) {
        rl.onSuccess('auth', identifier);
        const loggedIn = data.user as User;
        setUser(loggedIn);
        sessionStorage.setItem('handy-connect-user', JSON.stringify(loggedIn));
        return loggedIn;
      }
    } catch (err) {
      console.error('[auth] Login API call failed:', err);
    }

    // Failure — record the attempt for backoff calculation
    rl.onFailure('auth', identifier);
    return null;
  };

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = () => {
    if (user) {
      const lastSeenTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updateAllUsers({ ...user, lastSeen: `last seen today at ${lastSeenTime}` });
    }
    setUser(null);
    sessionStorage.removeItem('handy-connect-user');

    // Clear httpOnly session cookie via API route
    fetch('/api/auth/logout', { method: 'POST' })
      .catch(err => console.warn('[auth] Failed to clear session cookie:', err));
  };

  // ─── Signup ────────────────────────────────────────────────────────────────

  const signup = async (newUser: User, password: string): Promise<User | null | { rateLimited: true; message: string }> => {
    const rl = getClientRateLimiter();
    const rateLimitKey = `signup:${newUser.email}`;

    const check = rl.check('auth', rateLimitKey);
    if (!check.allowed) {
      return { rateLimited: true, message: check.message ?? 'Too many attempts. Please try again later.' };
    }

    const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingUser) {
      // Record a "failure" to prevent email enumeration via signup
      rl.onFailure('auth', rateLimitKey);
      return null;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: newUser, password }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          return { rateLimited: true, message: data.error ?? 'Too many attempts. Please try again later.' };
        }
        rl.onFailure('auth', rateLimitKey);
        return null;
      }

      const { user: registeredUser } = await res.json();
      rl.onSuccess('auth', rateLimitKey);
      setUser(registeredUser);
      sessionStorage.setItem('handy-connect-user', JSON.stringify(registeredUser));
      return registeredUser;
    } catch (err) {
      console.error('[auth] Registration API call failed:', err);
      rl.onFailure('auth', rateLimitKey);
      return null;
    }
  };

  // ─── Update user ───────────────────────────────────────────────────────────

  const updateUser = async (updatedUser: User) => {
    await updateAllUsers(updatedUser);

    if (user?.id === updatedUser.id) {
      const fullUserRecord = users.find(u => u.id === updatedUser.id);
      const userToSave: User = { ...fullUserRecord, ...updatedUser };
      setUser(userToSave);
      sessionStorage.setItem('handy-connect-user', JSON.stringify(userToSave));
    }
  };

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  const subscribeUser = (amount: string, method: string) => {
    if (user && user.role === 'worker') {
      const experience = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

      const historyEntry = {
        id: `pay-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        amount,
        plan: 'Pro Worker',
        method,
        status: 'paid' as const
      };

      const updatedUser: User = {
        ...user,
        isPro: true,
        experience,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        paymentHistory: [...(user.paymentHistory || []), historyEntry]
      };
      updateUser(updatedUser);
    }
  };

  const subscribeSeeker = (amount: string, method: string) => {
    if (user && user.role === 'seeker') {
      const seekerSubscriptionEndDate = new Date();
      seekerSubscriptionEndDate.setDate(seekerSubscriptionEndDate.getDate() + 15);

      const historyEntry = {
        id: `pay-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        amount,
        plan: 'Pro Seeker',
        method,
        status: 'paid' as const
      };

      const updatedUser: User = {
        ...user,
        isSeekerPro: true,
        seekerSubscriptionEndDate: seekerSubscriptionEndDate.toISOString(),
        paymentHistory: [...(user.paymentHistory || []), historyEntry]
      };
      updateUser(updatedUser);
    }
  };

  // ─── Admin Functions ───────────────────────────────────────────────────────

  const getAllUsers = (): User[] => {
    return users;
  };

  const grantSubscription = (workerId: string, durationDays: number) => {
    const worker = users.find(u => u.id === workerId && u.role === 'worker');
    if (!worker) return;

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays);

    const historyEntry = {
      id: `pay-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      amount: 'Admin Granted',
      plan: 'Pro Worker',
      method: 'Admin Grant',
      status: 'paid' as const
    };

    const updatedWorker: UserWithPassword = {
      ...worker,
      isPro: true,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      subscriptionGrantedBy: 'admin',
      paymentHistory: [...(worker.paymentHistory || []), historyEntry]
    };

    updateAllUsers(updatedWorker);
  };

  const revokeSubscription = (workerId: string) => {
    const worker = users.find(u => u.id === workerId && u.role === 'worker');
    if (!worker) return;

    const updatedWorker: UserWithPassword = {
      ...worker,
      isPro: false,
      subscriptionEndDate: undefined,
      subscriptionGrantedBy: undefined,
    };

    updateAllUsers(updatedWorker);
  };

  const updateIqamaStatus = (workerId: string, status: 'approved' | 'rejected', reason?: string) => {
    const worker = users.find(u => u.id === workerId && u.role === 'worker');
    if (!worker) return;

    const updatedWorker: UserWithPassword = {
      ...worker,
      iqamaStatus: status,
      iqamaVerifiedAt: new Date().toISOString(),
      isVerified: status === 'approved',
      iqamaRejectionReason: status === 'rejected' ? reason : undefined,
    };

    updateAllUsers(updatedWorker);
  };

  const submitIqama = (iqamaNumber: string, iqamaImageUrl: string, iqamaBackImageUrl: string) => {
    if (!user || user.role !== 'worker') return;

    const updatedUser: User = {
      ...user,
      iqamaNumber,
      iqamaImageUrl,
      iqamaBackImageUrl,
      iqamaStatus: 'pending',
      iqamaSubmittedAt: new Date().toISOString(),
      iqamaRejectionReason: undefined,
    };

    updateUser(updatedUser);
  };

  // ─── Password reset ─────────────────────────────────────────────────────────

  const requestPasswordReset = async (identifier: string): Promise<string | null> => {
    const rl = getClientRateLimiter();
    const check = rl.check('auth', `reset:${identifier}`);
    if (!check.allowed) {
      // Surface the rate-limit message through the return value convention.
      // The caller (forgot-password page) checks for null as a generic error;
      // the rate-limit toast is shown by the calling component instead.
      return `__rate_limited__:${check.message ?? 'Too many attempts.'}`;
    }

    const ident = identifier.toLowerCase();
    const foundUser = users.find(
      u => u.email.toLowerCase() === ident || u.username.toLowerCase() === ident || u.phone === identifier
    );

    // SECURITY: Always pretend to send the OTP regardless of whether the user
    // exists — this prevents user-enumeration via the password-reset flow.
    // The passcode is returned only when the user actually exists so the UI
    // can verify it; the caller must show the same generic UI in both cases.
    if (!foundUser) {
      rl.onFailure('auth', `reset:${identifier}`);
      // Return a fake code so the UI advances to step 2 (enter OTP).
      // The OTP will never match, so no real access is granted.
      // This is preferable to returning null which would reveal non-existence.
      const fakeCode = Math.floor(100000 + Math.random() * 900000).toString();
      return `__fake__${fakeCode}`;
    }

    try {
      const passcode = Math.floor(100000 + Math.random() * 900000).toString();
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { passcode, email: foundUser.email },
        EMAILJS_PUBLIC_KEY,
      );
      rl.onSuccess('auth', `reset:${identifier}`);
      return passcode;
    } catch (error) {
      // Log internally; surface only a generic failure to the UI
      console.error('[auth] Password reset email failed to send:', error);
      rl.onFailure('auth', `reset:${identifier}`);
      return null;
    }
  };

  // ─── Reset password ─────────────────────────────────────────────────────────

  const resetPassword = (identifier: string, newPassword: string): boolean => {
    const ident = identifier.toLowerCase();
    const userIndex = users.findIndex(
      u => u.email.toLowerCase() === ident || u.username.toLowerCase() === ident || u.phone === identifier
    );
    if (userIndex === -1) return false;

    const updatedUser = { ...users[userIndex], password: newPassword };
    updateAllUsers(updatedUser);
    return true;
  };

  const setPhoneVerified = (verified: boolean = true) => {
    if (user) {
      const updatedUser: User = { ...user, phoneVerified: verified };
      setUser(updatedUser);
      localStorage.setItem('handy-connect-user', JSON.stringify(updatedUser));
      sessionStorage.setItem('handy-connect-user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, signup, updateUser, subscribeUser, subscribeSeeker,
      requestPasswordReset, resetPassword,
      getAllUsers, grantSubscription, revokeSubscription, updateIqamaStatus, submitIqama,
      setPhoneVerified
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
