
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_admin',
  name: 'Dr. Sarah Jenkins',
  email: 'admin@eduanalytics.io',
  role: 'Academic Administrator',
  avatar_initials: 'SJ',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('edu_user');
      if (savedUser) return JSON.parse(savedUser);
      // Check if user has explicitly logged out before
      const hasLoggedOut = localStorage.getItem('edu_logged_out');
      return hasLoggedOut ? null : DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const savedToken = localStorage.getItem('edu_token');
      if (savedToken) return savedToken;
      const hasLoggedOut = localStorage.getItem('edu_logged_out');
      return hasLoggedOut ? null : 'demo_active_token';
    } catch {
      return 'demo_active_token';
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('edu_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('edu_user');
      }
      if (token) {
        localStorage.setItem('edu_token', token);
      } else {
        localStorage.removeItem('edu_token');
      }
    } catch {
      // ignore storage errors
    }
  }, [user, token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      localStorage.removeItem('edu_logged_out');
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    setIsLoading(true);
    try {
      const res = await authService.register(name, email, password, role);
      localStorage.removeItem('edu_logged_out');
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.setItem('edu_logged_out', 'true');
      localStorage.removeItem('edu_user');
      localStorage.removeItem('edu_token');
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
