import { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChange,
    signInWithEmail,
    signInWithGoogle,
    signInWithGoogleNative,
    signOut,
    signUpWithEmail
} from '../services/authService';

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  googleSignIn: (idToken: string, accessToken?: string) => Promise<void>;
  googleSignInNative: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      await signUpWithEmail(email, password, name);
    } catch (error) {
      throw error;
    }
  };

  const googleSignIn = async (idToken: string, accessToken?: string) => {
    try {
      await signInWithGoogle(idToken, accessToken);
    } catch (error) {
      throw error;
    }
  };

  const googleSignInNative = async () => {
    try {
      await signInWithGoogleNative();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    googleSignIn,
    googleSignInNative,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};