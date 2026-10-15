'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { users as mockUsers, User } from '@/lib/data';
import { getClientRateLimiter } from '@/lib/client-rate-limiter';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

type UserWithPassword = User & { password?: string };

// ---------------------------------------------------------------------------
// EmailJS credentials from environment variables (never hardcoded)
// ---------------------------------------------------------------------------
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? '';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? '';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthResult = User | null | { rateLimited: true; message: string } | { error: true; message: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  signup: (newUser: User, password: string) => Promise<AuthResult>;
  updateUser: (updatedUser: User) => void;
  subscribeUser: (amount: string, method: string) => void;
  subscribeSeeker: (amount: string, method: string) => void;
  requestPasswordReset: (identifier: string) => Promise<string | null>;
  resetPassword: (identifier: string, code: string, newPassword: string) => Promise<boolean>;
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
// Helpers
// ---------------------------------------------------------------------------

function checkSubscriptionExpiry(u: User): User {
  let fullUser = { ...u };
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

  return fullUser;
}

async function fetchUserById(userId: string): Promise<User | null> {
  if (userId === 'admin-001') {
    return null;
  }

  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    const data = snap.data();
    const { password: _p, ...sanitized } = data;
    return checkSubscriptionExpiry(sanitized as User);
  } catch (err) {
    console.warn('[auth] Failed to fetch user document from Firestore:', err);
    return null;
  }
}

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
      console.warn('[auth] Client writes to users are disabled during maintenance:', error);
    }
  };

  useEffect(() => {
    // 1. Rehydrate active session from httpOnly cookie via /api/auth/session
    async function rehydrateSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const sessionUser = data?.user;
        const sessionUserId = sessionUser?.id || sessionUser?.userId;
        if (!sessionUserId) {
          setUser(null);
          return;
        }

        // If admin session, rehydrate directly from server response (zero Firestore dependency)
        if (sessionUser?.role === 'admin' || sessionUserId === 'admin-001') {
          setUser(sessionUser as User);
          return;
        }

        const fullUser = await fetchUserById(sessionUserId);
        setUser(fullUser || (sessionUser as User));
      } catch (err) {
        console.warn('[auth] Session rehydration failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    rehydrateSession();

    // 2. Listen to Firebase users collection for directory browsing (read-only)
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        let fetchedUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const { password: _p, ...sanitized } = data;
          fetchedUsers.push(sanitized as User);
        });

        setUsers(fetchedUsers);
      },
      (error) => {
        console.warn('[auth] Firestore onSnapshot unreachable/offline:', error?.message);
      },
    );

    return () => unsubscribe();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = async (
    identifier: string,
    password: string,
  ): Promise<AuthResult> => {
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
        if (res.status >= 500) {
          const data = await res.json().catch(() => ({}));
          return { error: true, message: data.error ?? 'Server error during authentication. Check server environment variables.' };
        }
        rl.onFailure('auth', identifier);
        return null;
      }

      const data = await res.json();
      if (data.success && data.user) {
        rl.onSuccess('auth', identifier);
        // Admin user is completely hydrated from server response (zero Firestore dependency)
        if (data.user.id === 'admin-001' || data.user.role === 'admin') {
          setUser(data.user as User);
          return data.user as User;
        }
        const fullUser = await fetchUserById(data.user.id);
        const resolvedUser = fullUser || (data.user as User);
        setUser(resolvedUser);
        return resolvedUser;
      }
    } catch (err) {
      console.error('[auth] Login API call failed:', err);
      return { error: true, message: 'Network or server error communicating with authentication API.' };
    }

    // Failure — record the attempt for backoff calculation
    rl.onFailure('auth', identifier);
    return null;
  };

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = () => {
    // 1. Best-effort update of lastSeen in Firestore for regular users (safely isolated)
    if (user && user.role !== 'admin' && user.id !== 'admin-001') {
      try {
        const lastSeenTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDoc(
          doc(db, 'users', user.id),
          { lastSeen: `last seen today at ${lastSeenTime}` },
          { merge: true }
        ).catch((err) => {
          console.warn('[auth] Failed to update lastSeen in Firestore on logout:', err);
        });
      } catch (err) {
        console.warn('[auth] Error updating lastSeen on logout:', err);
      }
    }

    // 2. Always clear local user state
    setUser(null);

    // 3. Always clear httpOnly session cookie and revoke session in Firestore via API route
    try {
      fetch('/api/auth/logout', { method: 'POST' }).catch((err) =>
        console.warn('[auth] Failed to clear session cookie:', err),
      );
    } catch (err) {
      console.warn('[auth] Error triggering /api/auth/logout:', err);
    }
  };

  // ─── Signup ────────────────────────────────────────────────────────────────

  const signup = async (
    newUser: User,
    password: string,
  ): Promise<AuthResult> => {
    const rl = getClientRateLimiter();
    const rateLimitKey = `signup:${newUser.email}`;

    const check = rl.check('auth', rateLimitKey);
    if (!check.allowed) {
      return { rateLimited: true, message: check.message ?? 'Too many attempts. Please try again later.' };
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
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
        if (res.status >= 500) {
          const data = await res.json().catch(() => ({}));
          return { error: true, message: data.error ?? 'Server error during registration. Check server environment variables.' };
        }
        rl.onFailure('auth', rateLimitKey);
        return null;
      }

      const { user: registeredUser } = await res.json();
      rl.onSuccess('auth', rateLimitKey);
      const fullUser = await fetchUserById(registeredUser.id);
      const resolvedUser = fullUser || (registeredUser as User);
      setUser(resolvedUser);
      return resolvedUser;
    } catch (err) {
      console.error('[auth] Registration API call failed:', err);
      return { error: true, message: 'Network or server error communicating with registration API.' };
    }
  };

  // ─── Update user ───────────────────────────────────────────────────────────

  const updateUser = async (updatedUser: User) => {
    await updateAllUsers(updatedUser);

    if (user?.id === updatedUser.id) {
      const fullUserRecord = users.find((u) => u.id === updatedUser.id);
      const userToSave: User = { ...fullUserRecord, ...updatedUser };
      setUser(userToSave);
    }
  };

  // ─── Subscriptions (Wave 1: Client writes eliminated in favor of UI notices) ───

  const subscribeUser = (_amount: string, _method: string) => {
    console.warn('[auth] Subscription purchases are temporarily disabled during maintenance.');
  };

  const subscribeSeeker = (_amount: string, _method: string) => {
    console.warn('[auth] Subscription purchases are temporarily disabled during maintenance.');
  };

  // ─── Admin Functions (Wave 1: Client writes eliminated in favor of UI notices) ───

  const getAllUsers = (): User[] => {
    return users;
  };

  const grantSubscription = (_workerId: string, _durationDays: number) => {
    console.warn('[auth] Subscription grants are temporarily disabled during maintenance.');
  };

  const revokeSubscription = (_workerId: string) => {
    console.warn('[auth] Subscription revocations are temporarily disabled during maintenance.');
  };

  const updateIqamaStatus = (_workerId: string, _status: 'approved' | 'rejected', _reason?: string) => {
    console.warn('[auth] Iqama updates are temporarily disabled during maintenance.');
  };

  const submitIqama = (_iqamaNumber: string, _iqamaImageUrl: string, _iqamaBackImageUrl: string) => {
    console.warn('[auth] Iqama submissions are temporarily disabled during maintenance.');
  };

  // ─── Password reset ─────────────────────────────────────────────────────────

  const requestPasswordReset = async (identifier: string): Promise<string | null> => {
    const rl = getClientRateLimiter();
    const check = rl.check('auth', `reset:${identifier}`);
    if (!check.allowed) {
      return `__rate_limited__:${check.message ?? 'Too many attempts.'}`;
    }
    try {
      await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      rl.onSuccess('auth', `reset:${identifier}`);
    } catch {
      rl.onFailure('auth', `reset:${identifier}`);
    }
    // Always return a sentinel so UI moves to step 2 without revealing existence
    return '__server_handled__';
  };

  // ─── Reset password ─────────────────────────────────────────────────────────

  const resetPassword = async (identifier: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, newPassword }),
      });
      return res.ok;
    } catch (err) {
      console.error('[auth] Password reset verification failed:', err);
      return false;
    }
  };

  const setPhoneVerified = (verified: boolean = true) => {
    if (user) {
      const updatedUser: User = { ...user, phoneVerified: verified };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        signup,
        updateUser,
        subscribeUser,
        subscribeSeeker,
        requestPasswordReset,
        resetPassword,
        getAllUsers,
        grantSubscription,
        revokeSubscription,
        updateIqamaStatus,
        submitIqama,
        setPhoneVerified,
      }}
    >
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
