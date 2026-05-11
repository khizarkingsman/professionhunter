
'use client';

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {users as mockUsers, User} from '@/lib/data';
import emailjs from '@emailjs/browser';

type UserWithPassword = User & {password: string};

// Admin seed account
const ADMIN_ACCOUNT: UserWithPassword = {
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
  password: 'admin123',
  lastSeen: 'online',
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => User | null;
  logout: () => void;
  signup: (newUser: User, password: string) => User | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithPassword[]>([]);

  // Helper function to update a user in the main users array and save to localStorage
  const updateAllUsers = (updatedUser: Partial<UserWithPassword>) => {
    let newAllUsers: UserWithPassword[] = [];
    setUsers(prevAllUsers => {
        newAllUsers = prevAllUsers.map(u => 
            u.id === updatedUser.id ? { ...u, ...updatedUser } : u
        );
        localStorage.setItem('handy-connect-all-users', JSON.stringify(newAllUsers));
        return newAllUsers;
    });
    return newAllUsers;
  };

  useEffect(() => {
    setLoading(true);
    try {
      const storedUsers = localStorage.getItem('handy-connect-all-users');
      let allUsers: UserWithPassword[];
      if (storedUsers) {
        allUsers = JSON.parse(storedUsers);
      } else {
        allUsers = mockUsers.map(u => ({...u, password: 'password123'}));
      }

      // Ensure admin account always exists
      const adminExists = allUsers.find(u => u.id === ADMIN_ACCOUNT.id);
      if (!adminExists) {
        allUsers = [...allUsers, ADMIN_ACCOUNT];
      }

      localStorage.setItem('handy-connect-all-users', JSON.stringify(allUsers));
      setUsers(allUsers);

      const storedUser = localStorage.getItem('handy-connect-user');
      if (storedUser) {
        let parsedUser: User = JSON.parse(storedUser);
        let fullUser = allUsers.find(u => u.id === parsedUser.id) || parsedUser;

        // Check worker subscription status
        if (fullUser.role === 'worker' && fullUser.subscriptionEndDate) {
          if (new Date(fullUser.subscriptionEndDate) < new Date()) {
            console.log('Worker subscription expired for', fullUser.username);
            fullUser = { ...fullUser, isPro: false, subscriptionEndDate: undefined };
          }
        }
        
        // Check seeker subscription status
        if (fullUser.role === 'seeker' && fullUser.seekerSubscriptionEndDate) {
          if (new Date(fullUser.seekerSubscriptionEndDate) < new Date()) {
             console.log('Seeker subscription expired for', fullUser.username);
            fullUser = { ...fullUser, isSeekerPro: false, seekerSubscriptionEndDate: undefined };
          }
        }
        
        // Persist any changes from expiration checks
        const updatedAllUsers = allUsers.map(u => u.id === fullUser.id ? { ...u, ...fullUser } : u);
        localStorage.setItem('handy-connect-all-users', JSON.stringify(updatedAllUsers));
        localStorage.setItem('handy-connect-user', JSON.stringify(fullUser));

        setUser(fullUser);
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('handy-connect-user');
      localStorage.removeItem('handy-connect-all-users');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (identifier: string, password: string): User | null => {
    const ident = identifier.toLowerCase();
    const foundUser = users.find(
      u => (u.email.toLowerCase() === ident || u.username.toLowerCase() === ident || u.phone === identifier) && u.password === password
    );

    if (foundUser) {
      const userWithOnlineStatus = { ...foundUser, lastSeen: 'online' };
      const {password: _p, ...userToSave} = userWithOnlineStatus;
      
      updateAllUsers(userWithOnlineStatus);
      
      setUser(userToSave);
      localStorage.setItem('handy-connect-user', JSON.stringify(userToSave));
      return userToSave;
    }
    return null;
  };

  const logout = () => {
    if (user) {
        const lastSeenTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        updateAllUsers({ ...user, lastSeen: `last seen today at ${lastSeenTime}` });
    }
    setUser(null);
    localStorage.removeItem('handy-connect-user');
  };

  const signup = (newUser: User, password: string): User | null => {
    const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingUser) {
      return null;
    }

    const userWithPassword: UserWithPassword = {...newUser, password, isPro: false, isSeekerPro: false, lastSeen: 'online'};
    const newUsers = [...users, userWithPassword];
    setUsers(newUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));

    const {password: _p, ...userToSave} = userWithPassword;
    setUser(userToSave);
    localStorage.setItem('handy-connect-user', JSON.stringify(userToSave));
    return userToSave;
  };

  const updateUser = (updatedUser: User) => {
    const newUsers = updateAllUsers(updatedUser);

    if (user?.id === updatedUser.id) {
      // Find the full record to ensure password isn't lost from the main state
      const fullUserRecord = newUsers.find(u => u.id === updatedUser.id);
      const userToSave = { ...fullUserRecord, ...updatedUser };
      const { password, ...rest } = userToSave; // Omit password for client-side storage
      setUser(rest as User);
      localStorage.setItem('handy-connect-user', JSON.stringify(rest));
    }
  };

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

  // --- Admin Functions ---

  const getAllUsers = (): User[] => {
    return users.map(({password: _p, ...rest}) => rest as User);
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

    const newAllUsers = users.map(u => u.id === workerId ? updatedWorker : u);
    setUsers(newAllUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newAllUsers));
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

    const newAllUsers = users.map(u => u.id === workerId ? updatedWorker : u);
    setUsers(newAllUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newAllUsers));
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

    const newAllUsers = users.map(u => u.id === workerId ? updatedWorker : u);
    setUsers(newAllUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newAllUsers));
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

  const requestPasswordReset = async (identifier: string): Promise<string | null> => {
    const ident = identifier.toLowerCase();
    const foundUser = users.find(
      u => u.email.toLowerCase() === ident || u.username.toLowerCase() === ident || u.phone === identifier
    );
    if (!foundUser) return null;
    
    try {
      const passcode = Math.floor(100000 + Math.random() * 900000).toString();
      await emailjs.send(
        'service_j4hucj8',
        'template_zfcdf0m',
        { passcode, email: foundUser.email },
        'JqGY4lkRNu1YzJTG4'
      );
      return passcode;
    } catch (error) {
      console.error('Error sending EmailJS OTP', error);
      return null;
    }
  };

  const resetPassword = (identifier: string, newPassword: string): boolean => {
    const ident = identifier.toLowerCase();
    const userIndex = users.findIndex(
      u => u.email.toLowerCase() === ident || u.username.toLowerCase() === ident || u.phone === identifier
    );
    if (userIndex === -1) return false;
    
    const updatedUsers = [...users];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
    setUsers(updatedUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(updatedUsers));
    return true;
  };


  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, signup, updateUser, subscribeUser, subscribeSeeker,
      requestPasswordReset, resetPassword,
      getAllUsers, grantSubscription, revokeSubscription, updateIqamaStatus, submitIqama
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
