import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SafeArea } from '../components/ui/SafeArea';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { statusBarStyle, backgroundColor } = useTheme();
  const { login, googleSignIn } = useAuth();

  // Configure Google Auth Request - Simplified for Android compatibility
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    selectAccount: true, // Force account selection
  });

  useEffect(() => {
    if (response?.type === 'success') {
      console.log('Google Auth Success - Full response:', JSON.stringify(response, null, 2));
      const { authentication } = response;
      
      if (authentication) {
        console.log('Authentication object exists:', JSON.stringify(authentication, null, 2));
        handleGoogleAuth(authentication);
      } else {
        console.error('No authentication object in response');
        Alert.alert('Authentication Error', 'Authentication data is missing from response');
        setGoogleLoading(false);
      }
    } else if (response?.type === 'error') {
      console.error('Google Auth Error Details:', {
        error: response.error,
        errorCode: response.error?.code,
        errorMessage: response.error?.message,
        params: response.params,
        url: response.url,
        fullResponse: JSON.stringify(response, null, 2)
      });
      Alert.alert(
        'Authentication Error', 
        `Error: ${response.error?.message || response.error || 'Unknown error'}\n\nCheck console for details.`
      );
      setGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      console.log('Google Auth Dismissed by user');
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleAuth = async (authentication: any) => {
    console.log('Full authentication object:', JSON.stringify(authentication, null, 2));
    
    // Check for idToken in different possible locations
    const idToken = authentication?.idToken || authentication?.id_token;
    const accessToken = authentication?.accessToken || authentication?.access_token;
    
    console.log('Extracted tokens:', { 
      idToken: idToken ? 'Present' : 'Missing', 
      accessToken: accessToken ? 'Present' : 'Missing' 
    });
    
    if (!idToken) {
      console.error('No idToken found in authentication response');
      Alert.alert(
        'Authentication Error', 
        'ID Token is missing from Google response. Please try again.'
      );
      setGoogleLoading(false);
      return;
    }

    try {
      // Use the existing Firebase googleSignIn method that works with tokens
      await googleSignIn(idToken, accessToken);
      setGoogleLoading(false);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error in Google authentication:', error);
      Alert.alert('Authentication Error', error.message || 'Could not complete sign in process');
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validate email and password
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setGoogleLoading(false);
      }
      // The useEffect will handle the success case
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Sign In Failed', error.message || 'Could not sign in with Google');
      setGoogleLoading(false);
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
            <Text style={styles.appName}>AutoTracker</Text>
            <Text style={styles.tagline}>Track your vehicle maintenance with ease</Text>
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Sign In with Google"
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              variant="outline"
              fullWidth
              icon={<Ionicons name="logo-google" size={20} color="#3B82F6" />}
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6B7280',
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
