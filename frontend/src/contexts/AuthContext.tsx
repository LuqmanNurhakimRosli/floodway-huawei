import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginDemo: () => void;
  login: (email: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // A saved profile is only trusted when it has the right shape; anything else (an old format, a hand edit) would
    // crash every screen that reads the name, so it is dropped and the demo profile is used instead.
    try {
      const saved = JSON.parse(localStorage.getItem('floodway_user') || 'null');
      if (saved && typeof saved === 'object' && typeof saved.name === 'string' && typeof saved.email === 'string') return saved;
    } catch (e) {}
    // Default demo user for instant reviewer access
    return {
      id: 'usr-01',
      name: 'Luqman Nurhakim',
      email: 'luqman@floodway.my',
      phone: '+60 12-345 6789',
      isDemo: true
    };
  });

  const [loading, setLoading] = useState(false);

  const loginDemo = () => {
    const demoUser: User = {
      id: 'usr-01',
      name: 'Luqman Nurhakim',
      email: 'luqman@floodway.my',
      phone: '+60 12-345 6789',
      isDemo: true
    };
    setUser(demoUser);
    localStorage.setItem('floodway_user', JSON.stringify(demoUser));
  };

  const login = (email: string, name: string) => {
    const u: User = {
      id: `usr-${Date.now()}`,
      name: name || 'Citizen Evaluator',
      email,
      phone: '+60 11-234 5678',
      isDemo: false
    };
    setUser(u);
    localStorage.setItem('floodway_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('floodway_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginDemo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
