'use client';

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {users as mockUsers, User} from '@/lib/data';

// This is a simple in-memory store for passwords.
// In a real app, you would never store passwords in plaintext.
const passwordStore: Record<string, string> = {
  'john.d@example.com': 'password123',
  'jane.s@example.com': 'password123',
  'mike.j@example.com': 'password123',
  'emily.w@example.com': 'password123',
  'alice.b@example.com': 'password123',
  'bob.g@example.com': 'password123',
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  signup: (newUser: User, password: string) => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    // Try to load user from localStorage on initial load
    try {
      const storedUser = localStorage.getItem('handy-connect-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('handy-connect-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email: string, password: string): User | null => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const storedPassword = passwordStore[email.toLowerCase()];

    if (foundUser && storedPassword === password) {
      setUser(foundUser);
      localStorage.setItem('handy-connect-user', JSON.stringify(foundUser));
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('handy-connect-user');
    // We don't redirect here, redirection should be handled by components
    // that use the logout function, often via a useEffect hook monitoring the user state.
  };

  const signup = (newUser: User, password: string): User | null => {
    const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingUser) {
      return null; // User already exists
    }

    // Add new user to our mock data
    setUsers(prevUsers => [...prevUsers, newUser]);
    passwordStore[newUser.email.toLowerCase()] = password;

    // Log the new user in
    setUser(newUser);
    localStorage.setItem('handy-connect-user', JSON.stringify(newUser));
    return newUser;
  };

  return (
    <AuthContext.Provider value={{user, loading, login, logout, signup}}>
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
