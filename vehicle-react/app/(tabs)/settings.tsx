import Button from '@/components/ui/Button';
import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const { darkMode, toggleDarkMode, setDarkMode, statusBarStyle, setMileageUnit } = useTheme();
  const { user, updateUser, logout, deleteUser } = useAuth();
  const [useMiles, setUseMiles] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Keep local state in sync with user data
  useEffect(() => {
    if (user) {
      setUseMiles(user.mileage_type === 'miles');
      // Dark mode is handled by ThemeContext already
    }
  }, [user]);

  const handleDarkModeToggle = async (value: boolean) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateUser({ dark_mode: value });
      setDarkMode(value);
    } catch (error: any) {
      console.error('Failed to update dark mode:', error);
      Alert.alert('Error', 'Failed to save dark mode preference');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMileageToggle = async (value: boolean) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const mileageType = value ? 'miles' : 'kilometers';
      await updateUser({ mileage_type: mileageType });
      setUseMiles(value);
      setMileageUnit(value); // Update theme context immediately
    } catch (error: any) {
      console.error('Failed to update mileage preference:', error);
      Alert.alert('Error', 'Failed to save mileage preference');
      // Revert the toggle
      setUseMiles(!value);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete all your vehicles, maintenance logs, fuel logs, and reminders. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Forever', 
          style: 'destructive',
          onPress: confirmDeleteAccount
        }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance to cancel. Are you absolutely sure you want to permanently delete your account and all data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Delete Everything', 
          style: 'destructive',
          onPress: performDeleteAccount
        }
      ]
    );
  };

  const performDeleteAccount = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await deleteUser();
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. You will now be redirected to the login screen.',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      Alert.alert(
        'Deletion Failed', 
        error.message || 'Failed to delete account. Please try again or contact support.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <SafeArea style={styles.container}>
      <StatusBar style={statusBarStyle} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={22} color="#4B5563" />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
              thumbColor={darkMode ? '#3B82F6' : '#9CA3AF'}
              disabled={isUpdating}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="speedometer-outline" size={22} color="#4B5563" />
              <Text style={styles.settingLabel}>Use Miles (instead of Kilometers)</Text>
            </View>
            <Switch
              value={useMiles}
              onValueChange={handleMileageToggle}
              trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
              thumbColor={useMiles ? '#3B82F6' : '#9CA3AF'}
              disabled={isUpdating}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/edit-profile')}
          >
            <View style={styles.actionInfo}>
              <Ionicons name="person-outline" size={22} color="#4B5563" />
              <Text style={styles.actionLabel}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/change-password')}
          >
            <View style={styles.actionInfo}>
              <Ionicons name="lock-closed-outline" size={22} color="#4B5563" />
              <Text style={styles.actionLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionItem, isUpdating && styles.disabledItem]}
            onPress={handleDeleteAccount}
            disabled={isUpdating}
          >
            <View style={styles.actionInfo}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
              <Text style={[styles.actionLabel, styles.dangerText]}>
                {isUpdating ? 'Deleting Account...' : 'Delete Account'}
              </Text>
            </View>
            {!isUpdating && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoutButtonContainer}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  disabledItem: {
    opacity: 0.5,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
  },
  dangerText: {
    color: '#EF4444',
  },
  logoutButtonContainer: {
    marginVertical: 24,
  },
});
