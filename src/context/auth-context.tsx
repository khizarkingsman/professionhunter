
'use client';

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {users as mockUsers, User} from '@/lib/data';

type UserWithPassword = User & {password: string};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  signup: (newUser: User, password: string) => User | null;
  updateUser: (updatedUser: User) => void;
  subscribeUser: () => void;
  subscribeSeeker: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithPassword[]>([]);

  useEffect(() => {
    setLoading(true);
    try {
      const storedUsers = localStorage.getItem('handy-connect-all-users');
      let allUsers: UserWithPassword[];
      if (storedUsers) {
        allUsers = JSON.parse(storedUsers);
      } else {
        allUsers = mockUsers.map(u => ({...u, password: 'password123'}));
        localStorage.setItem('handy-connect-all-users', JSON.stringify(allUsers));
      }
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

  const login = (email: string, password: string): User | null => {
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const {password: _p, ...userToSave} = foundUser;
      setUser(userToSave);
      localStorage.setItem('handy-connect-user', JSON.stringify(userToSave));
      return userToSave;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('handy-connect-user');
  };

  const signup = (newUser: User, password: string): User | null => {
    const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingUser) {
      return null;
    }

    const userWithPassword: UserWithPassword = {...newUser, password, isPro: false, isSeekerPro: false};
    const newUsers = [...users, userWithPassword];
    setUsers(newUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));

    const {password: _p, ...userToSave} = userWithPassword;
    setUser(userToSave);
    localStorage.setItem('handy-connect-user', JSON.stringify(userToSave));
    return userToSave;
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(u => {
        if (u.id === updatedUser.id) {
          return {...u, ...updatedUser};
        }
        return u;
      });
      localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));
      return newUsers;
    });

    if (user?.id === updatedUser.id) {
      const fullUserRecord = users.find(u => u.id === updatedUser.id);
      const {password: _p, ...userToSave} = {...fullUserRecord, ...updatedUser};
      setUser(userToSave);
      localStorage.setItem('handy-connect-user', JSON.stringify(userToSave));
    }
  };

  const subscribeUser = () => {
    if (user && user.role === 'worker') {
      const experience = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
      const updatedUser: User = {
        ...user,
        isPro: true,
        experience,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
      };
      updateUser(updatedUser);
    }
  };
  
  const subscribeSeeker = () => {
    if (user && user.role === 'seeker') {
      const seekerSubscriptionEndDate = new Date();
      seekerSubscriptionEndDate.setDate(seekerSubscriptionEndDate.getDate() + 15);
      const updatedUser: User = {
        ...user,
        isSeekerPro: true,
        seekerSubscriptionEndDate: seekerSubscriptionEndDate.toISOString(),
      };
      updateUser(updatedUser);
    }
  };


  return (
    <AuthContext.Provider value={{user, loading, login, logout, signup, updateUser, subscribeUser, subscribeSeeker}}>
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
