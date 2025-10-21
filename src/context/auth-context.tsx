'use client';

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {users as mockUsers, User} from '@/lib/data';

// This is a simple in-memory store for passwords.
// In a real app, you would never store passwords in plaintext.
const initialPasswordStore: Record<string, string> = {
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
  const [users, setUsers] = useState<User[]>([]);
  const [passwordStore, setPasswordStore] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('handy-connect-user');
      const storedUsers = localStorage.getItem('handy-connect-all-users');
      const storedPasswords = localStorage.getItem('handy-connect-passwords');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        setUsers(mockUsers);
        localStorage.setItem('handy-connect-all-users', JSON.stringify(mockUsers));
      }

      if (storedPasswords) {
        setPasswordStore(JSON.parse(storedPasswords));
      } else {
        setPasswordStore(initialPasswordStore);
        localStorage.setItem('handy-connect-passwords', JSON.stringify(initialPasswordStore));
      }
    } catch (error) {
      console.error('Failed to parse data from localStorage', error);
      // Reset to defaults if parsing fails
      localStorage.removeItem('handy-connect-user');
      localStorage.setItem('handy-connect-all-users', JSON.stringify(mockUsers));
      localStorage.setItem('handy-connect-passwords', JSON.stringify(initialPasswordStore));
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

    // Add new user to our mock data and persist it
    const newUsers = [...users, newUser];
    const newPasswords = {...passwordStore, [newUser.email.toLowerCase()]: password};

    setUsers(newUsers);
    setPasswordStore(newPasswords);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));
    localStorage.setItem('handy-connect-passwords', JSON.stringify(newPasswords));

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
