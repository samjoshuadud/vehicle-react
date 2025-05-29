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
  updateUser: (userData: Partial<User>) => Promise<void>;
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
      console.log('🔍 AuthContext: Loading stored user data...');
      const userData = await AsyncStorage.getItem('user');
      const tokenData = await AsyncStorage.getItem('token');
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      
      console.log('📱 AuthContext: Stored data check:', {
        hasUser: !!userData,
        hasToken: !!tokenData,
        rememberMe: rememberMe
      });
      
      if (userData && tokenData && rememberMe === 'true') {
        console.log('🔐 AuthContext: Validating stored token with backend...');
        // Validate the stored token before using it
        const isValidToken = await apiService.validateToken(tokenData);
        
        if (isValidToken) {
          console.log('✅ AuthContext: Token is valid, user authenticated');
          setUser(JSON.parse(userData));
          setToken(tokenData);
        } else {
          // Token is invalid, clear stored data
          console.log('❌ AuthContext: Stored token is invalid, clearing data');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('rememberMe');
        }
      } else {
        console.log('🚫 AuthContext: No valid stored credentials found');
      }
    } catch (error) {
      console.error('💥 AuthContext: Error loading user:', error);
      // Clear potentially corrupted data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('rememberMe');
    } finally {
      console.log('✅ AuthContext: Load user process completed');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log('🚀 AuthContext: Starting login process for:', email);
      console.log('📡 AuthContext: Making API call to backend...');
      const loginResponse = await apiService.login(email, password);
      console.log('✅ AuthContext: Login API call successful, fetching profile...');
      const userProfile = await apiService.getUserProfile(loginResponse.access_token);
      console.log('👤 AuthContext: User profile fetched successfully');
      
      console.log('💾 AuthContext: Storing user data locally...');
      await AsyncStorage.setItem('token', loginResponse.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userProfile));
      await AsyncStorage.setItem('rememberMe', rememberMe.toString());
      
      setToken(loginResponse.access_token);
      setUser(userProfile);
      console.log('🎉 AuthContext: Login process completed successfully');
    } catch (error) {
      console.error('💥 AuthContext: Login failed', error);
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

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      console.log('🔄 AuthContext: Updating user profile...', userData);
      const updatedUser = await apiService.updateUser(token, userData);
      
      console.log('💾 AuthContext: Storing updated user data locally...');
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      console.log('✅ AuthContext: User profile updated successfully');
    } catch (error) {
      console.error('💥 AuthContext: User update failed', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', typeof error, error);
      }
      throw error;
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
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};