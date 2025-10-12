import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SafeArea } from '../components/ui/SafeArea';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { statusBarStyle, backgroundColor } = useTheme();
  const { login } = useAuth();

  const handleLogin = async () => {
    // Validate email and password
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      let errorTitle = 'Login Failed';
      let errorMessage = 'Please check your credentials and try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid') || error.message.includes('incorrect') || 
            error.message.includes('wrong') || error.message.includes('authentication')) {
          errorTitle = 'Invalid Credentials';
          errorMessage = 'The email or password you entered is incorrect. Please check and try again.';
        } else if (error.message.includes('Connection error') || error.message.includes('internet connection')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('Server connection error') || error.message.includes('backend server')) {
          errorTitle = 'Server Unavailable';
          errorMessage = 'The server is currently unavailable. Please try again later or contact support if the problem persists.';
        } else if (error.message.includes('Server error') || error.message.includes('try again later')) {
          errorTitle = 'Server Error';
          errorMessage = 'The server encountered an error. Please try again in a few minutes.';
        } else if (error.message.includes('account') && error.message.includes('not found')) {
          errorTitle = 'Account Not Found';
          errorMessage = 'No account was found with this email address. Please check your email or sign up for a new account.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Garahe</Text>
            <Text style={styles.tagline}>Track vehicle maintenance and fuel prices with ease</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
            />

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signUpText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});
