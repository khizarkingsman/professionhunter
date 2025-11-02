
'use client';

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {users as mockUsers, User} from '@/lib/data';

// This is a simple in-memory store for passwords.
// In a real app, you would never store passwords in plaintext.
// We will move this into the user object itself for better persistence in this demo.
// const passwordStore: Record<string, string> = {};

// Add a password property to the user for this demo.
// In a real app, you'd never store plaintext passwords.
type UserWithPassword = User & {password: string};

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
  const [users, setUsers] = useState<UserWithPassword[]>([]);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    setLoading(true);
    try {
      const storedUsers = localStorage.getItem('handy-connect-all-users');
      let allUsers: UserWithPassword[];
      if (storedUsers) {
        allUsers = JSON.parse(storedUsers);
      } else {
        // First time run, assign default passwords to mock users
        allUsers = mockUsers.map(u => ({...u, password: 'password123'}));
        localStorage.setItem('handy-connect-all-users', JSON.stringify(allUsers));
      }
      setUsers(allUsers);

      const storedUser = localStorage.getItem('handy-connect-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Find the full user object from allUsers to ensure data is fresh
        const fullUser = allUsers.find(u => u.id === parsedUser.id);
        setUser(fullUser || parsedUser);
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
      const {password: _p, ...userToSave} = foundUser; // Don't include password in the session user object
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
      return null; // User already exists
    }

    const userWithPassword: UserWithPassword = {...newUser, password};
    const newUsers = [...users, userWithPassword];
    setUsers(newUsers);
    localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));

    // Log the new user in
    const {password: _p, ...userToSave} = userWithPassword;
    setUser(userToSave);
    localStorage.setItem('handy-connect-user', JSON.stringify(userToSave));
    return userToSave;
  };

  const updateUser = (updatedUser: User) => {
    const newUsers = users.map(u => {
      if (u.id === updatedUser.id) {
        // Preserve password when updating
        return {...updatedUser, password: u.password};
      }
      return u;
    });
    setUsers(newUsers);

    // This is the part that saves to localStorage. We need to be careful with size.
    // If the avatarUrl is a large base64 string, we should not save it back into the all-users list.
    const userForStorage = newUsers.find(u => u.id === updatedUser.id);
    if (userForStorage && userForStorage.avatarUrl && userForStorage.avatarUrl.startsWith('data:image')) {
      // Create a version of the user list where the updated user does not have the large base64 string
      const {avatarUrl, ...restOfUser} = userForStorage;
      const originalUser = users.find(u => u.id === updatedUser.id);
      const userToStore = {...restOfUser, avatarUrl: originalUser?.avatarUrl || ''};
      const usersForStorage = newUsers.map(u => (u.id === updatedUser.id ? userToStore : u));

      try {
        localStorage.setItem('handy-connect-all-users', JSON.stringify(usersForStorage));
      } catch (e) {
        console.error('Failed to set item in localStorage', e);
      }
    } else {
      try {
        localStorage.setItem('handy-connect-all-users', JSON.stringify(newUsers));
      } catch (e) {
        console.error('Failed to set item in localStorage', e);
      }
    }

    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
      // Also update the current user session storage, but without the large image data
      // to avoid quota errors there as well.
      const userForSessionStorage = {...updatedUser};
      if (userForSessionStorage.avatarUrl && userForSessionStorage.avatarUrl.startsWith('data:image')) {
        // If we have a base64 image, don't store it in the session to avoid errors.
        const {avatarUrl, ...rehydratedUser} = userForSessionStorage;
        localStorage.setItem('handy-connect-user', JSON.stringify(rehydratedUser));
      } else {
        localStorage.setItem('handy-connect-user', JSON.stringify(updatedUser));
      }
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
