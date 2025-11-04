
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
        const parsedUser = JSON.parse(storedUser);
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

    const userWithPassword: UserWithPassword = {...newUser, password, isPro: false};
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
      setUser(updatedUser);
      localStorage.setItem('handy-connect-user', JSON.stringify(updatedUser));
    }
  };

  const subscribeUser = () => {
    if (user && user.role === 'worker') {
      const experience = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
      const updatedUser = {...user, isPro: true, experience};
      updateUser(updatedUser);
    }
  };


  return (
    <AuthContext.Provider value={{user, loading, login, logout, signup, updateUser, subscribeUser}}>
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
