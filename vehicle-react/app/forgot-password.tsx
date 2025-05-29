import { apiService } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SafeArea } from '../components/ui/SafeArea';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const { statusBarStyle, backgroundColor } = useTheme();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Missing Information', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.requestPasswordReset(email);
      
      // Real email sending - no token returned
      Alert.alert(
        'Reset Code Sent', 
        'A 6-digit reset code has been sent to your email address. Please check your inbox and spam folder.',
        [{ text: 'OK', onPress: () => setStep('reset') }]
      );
    } catch (error: any) {
      let errorTitle = 'Unable to Send Reset Code';
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Connection error') || error.message.includes('internet connection')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('Server connection error') || error.message.includes('backend server')) {
          errorTitle = 'Server Unavailable';
          errorMessage = 'The server is currently unavailable. Please try again later or contact support if the problem persists.';
        } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
          errorTitle = 'Email Not Found';
          errorMessage = 'No account was found with this email address. Please check your email and try again.';
        } else if (error.message.includes('Server error') || error.message.includes('try again later')) {
          errorTitle = 'Server Error';
          errorMessage = 'The server encountered an error. Please try again in a few minutes.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetToken || !newPassword || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (resetToken.length !== 6) {
      Alert.alert('Invalid Reset Code', 'Please enter the complete 6-digit reset code');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.resetPassword(email, resetToken, newPassword);
      
      Alert.alert(
        'Password Reset Successful', 
        'Your password has been reset successfully. Please log in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      let errorTitle = 'Password Reset Failed';
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid') || error.message.includes('code') || error.message.includes('token')) {
          errorTitle = 'Invalid Reset Code';
          errorMessage = 'The reset code is invalid or has expired. Please request a new reset code and try again.';
        } else if (error.message.includes('expired')) {
          errorTitle = 'Code Expired';
          errorMessage = 'The reset code has expired. Please request a new reset code.';
        } else if (error.message.includes('Connection error') || error.message.includes('internet connection')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('Server connection error') || error.message.includes('backend server')) {
          errorTitle = 'Server Unavailable';
          errorMessage = 'The server is currently unavailable. Please try again later or contact support if the problem persists.';
        } else if (error.message.includes('Server error') || error.message.includes('try again later')) {
          errorTitle = 'Server Error';
          errorMessage = 'The server encountered an error. Please try again in a few minutes.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Ionicons name="mail-outline" size={48} color="#3B82F6" />
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a reset code to create a new password.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
          />

          <Button
            title="Send Reset Code"
            onPress={handleRequestReset}
            loading={isLoading}
            fullWidth
            style={styles.button}
          />
        </View>

        <TouchableOpacity 
          style={styles.backToLogin}
          onPress={() => router.back()}
        >
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderResetStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setStep('request')}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Reset Code</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#3B82F6" />
          <Text style={styles.title}>Enter Reset Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {email} and create your new password.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Reset Code"
            placeholder="Enter 6-digit code"
            value={resetToken}
            onChangeText={setResetToken}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon={<Ionicons name="keypad-outline" size={20} color="#6B7280" />}
          />

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
          />

          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
          />

          <Button
            title="Reset Password"
            onPress={handlePasswordReset}
            loading={isLoading}
            fullWidth
            style={styles.button}
          />
        </View>

        <TouchableOpacity 
          style={styles.resendCode}
          onPress={() => setStep('request')}
        >
          <Text style={styles.resendCodeText}>Didn't receive code? Send again</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {step === 'request' ? renderRequestStep() : renderResetStep()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
  backToLogin: {
    alignSelf: 'center',
  },
  backToLoginText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  resendCode: {
    alignSelf: 'center',
  },
  resendCodeText: {
    color: '#3B82F6',
    fontSize: 14,
  },
});
