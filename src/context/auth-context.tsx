
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
  'alex.d@example.com': 'password123',
  'alice.b@example.com': 'password123',
  'bob.g@example.com': 'password123',
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  signup: (newUser: User, password: string) => User | null;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    setLoading(true);
    try {
      const storedUsers = localStorage.getItem('handy-connect-all-users');
      let allUsers: User[];
      if (storedUsers) {
        allUsers = JSON.parse(storedUsers);
      } else {
        allUsers = mockUsers;
        localStorage.setItem('handy-connect-all-users', JSON.stringify(mockUsers));
      }
      setUsers(allUsers);
      
      // Also update the in-memory password store for any user, including newly signed up users.
      allUsers.forEach((u: User) => {
        if (u.email && !passwordStore[u.email.toLowerCase()]) {
          // This is a placeholder for signup-created passwords.
          // In a real app this would be handled securely, but for this demo
          // we'll use a default password. We assume all new signups use this.
          passwordStore[u.email.toLowerCase()] = 'password123';
        }
      });

      const storedUser = localStorage.getItem('handy-connect-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
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
    // For simplicity, we don't clear the all-users list on logout
  };

  const signup = (newUser: User, password: string): User | null => {
    const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingUser) {
      return null; // User already exists
    }

    const newUsers = [...users, newUser];
    setUsers(newUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));

    // Store password for the new user for the current session
    // @ts-ignore
    passwordStore[newUser.email.toLowerCase()] = password;

    // Log the new user in
    setUser(newUser);
    localStorage.setItem('handy-connect-user', JSON.stringify(newUser));
    return newUser;
  };

  const updateUser = (updatedUser: User) => {
    const newUsers = users.map(u => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(newUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));

    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
      localStorage.setItem('handy-connect-user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{user, loading, login, logout, signup, updateUser}}>
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
