import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User as ApiUser } from '../services/api';

interface User {
  user_id: number;
  email: string;
  full_name: string;
  mileage_type: string;
  dark_mode: boolean;
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const tokenData = await AsyncStorage.getItem('token');
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      
      if (userData && tokenData && rememberMe === 'true') {
        // Validate the stored token before using it
        const isValidToken = await apiService.validateToken(tokenData);
        
        if (isValidToken) {
          setUser(JSON.parse(userData));
          setToken(tokenData);
        } else {
          // Token is invalid, clear stored data
          console.log('AuthContext: Stored token is invalid, clearing data');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('rememberMe');
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Clear potentially corrupted data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('rememberMe');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log('AuthContext: Starting login process');
      const loginResponse = await apiService.login(email, password);
      console.log('AuthContext: Login successful, fetching profile');
      const userProfile = await apiService.getUserProfile(loginResponse.access_token);
      
      await AsyncStorage.setItem('token', loginResponse.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userProfile));
      await AsyncStorage.setItem('rememberMe', rememberMe.toString());
      
      setToken(loginResponse.access_token);
      setUser(userProfile);
      console.log('AuthContext: Login complete');
    } catch (error) {
      console.error('AuthContext: Login failed', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      console.log('AuthContext: Starting registration process');
      const newUser = await apiService.register({
        full_name: fullName,
        email,
        password,
        mileage_type: 'kilometers',
        dark_mode: false,
      });

      console.log('AuthContext: Registration successful, logging in');
      // After successful registration, log the user in
      await login(email, password);
    } catch (error) {
      console.error('AuthContext: Registration failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('rememberMe');
      setUser(null);
      setToken(null);
    } catch (error) {
      throw new Error('Logout failed');
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};