import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';

export default function ChangePasswordScreen() {
  const { statusBarStyle, backgroundColor } = useTheme();
  const { token } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswords = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all password fields');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Invalid Password', 'New password must be at least 8 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Same Password', 'New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be logged in to change your password');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.changePassword(token, currentPassword, newPassword);
      
      Alert.alert(
        'Success', 
        'Password changed successfully', 
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Failed to change password:', error);
      Alert.alert('Error', error.message || 'Failed to change password. Please check your current password and try again.');
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Choose a strong password with at least 8 characters
            </Text>
          </View>

          <Input
            label="Current Password *"
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons 
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            }
          />
          
          <Input
            label="New Password *"
            placeholder="Enter your new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            leftIcon={<Ionicons name="key-outline" size={20} color="#6B7280" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            }
          />
          
          <Input
            label="Confirm New Password *"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color="#6B7280" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            }
          />

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirement}>
              <Ionicons 
                name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword.length >= 8 ? "#10B981" : "#6B7280"} 
              />
              <Text style={[
                styles.requirementText,
                { color: newPassword.length >= 8 ? "#10B981" : "#6B7280" }
              ]}>
                At least 8 characters
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons 
                name={newPassword !== confirmPassword ? "ellipse-outline" : newPassword && confirmPassword ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword === confirmPassword && newPassword && confirmPassword ? "#10B981" : "#6B7280"} 
              />
              <Text style={[
                styles.requirementText,
                { color: newPassword === confirmPassword && newPassword && confirmPassword ? "#10B981" : "#6B7280" }
              ]}>
                Passwords match
              </Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Change Password"
              onPress={handleChangePassword}
              loading={isLoading}
              fullWidth
              disabled={!currentPassword || !newPassword || !confirmPassword}
            />
          </View>
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1E40AF',
    flex: 1,
  },
  passwordRequirements: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 13,
  },
  buttonContainer: {
    marginTop: 32,
  },
});
