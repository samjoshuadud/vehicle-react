import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SafeArea } from '@/components/ui/SafeArea';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { useReminders } from '@/context/RemindersContext';
import { Reminder } from '@/services/api';

type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'mileage';

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { statusBarStyle, backgroundColor } = useTheme();
  const { vehicles } = useVehicles();
  const { getReminderById, updateReminder, deleteReminder } = useReminders();
  
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>('none');
  const [mileageInterval, setMileageInterval] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load reminder data on mount
  useEffect(() => {
    const loadReminder = async () => {
      if (!id) return;
      
      try {
        setIsInitialLoading(true);
        const reminderData = await getReminderById(parseInt(id));
        setReminder(reminderData);
        setTitle(reminderData.title);
        setDescription(reminderData.description || '');
        setDate(reminderData.due_date);
        setRepeatInterval((reminderData.repeat_interval as RepeatInterval) || 'none');
      } catch (error) {
        console.error('Error loading reminder:', error);
        Alert.alert('Error', 'Failed to load reminder data', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadReminder();
  }, [id, getReminderById]);

  const handleSave = async () => {
    if (!title || !description || !date) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    if (repeatInterval === 'mileage' && !mileageInterval) {
      Alert.alert('Missing Information', 'Please enter a mileage interval');
      return;
    }

    setIsLoading(true);
    try {
      await updateReminder(parseInt(id!), {
        title,
        description,
        due_date: date,
        repeat_interval: repeatInterval === 'none' ? undefined : repeatInterval,
      });
      
      Alert.alert('Success', 'Reminder updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating reminder:', error);
      Alert.alert('Error', 'Failed to update reminder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteReminder(parseInt(id!));
              Alert.alert('Success', 'Reminder deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const placeholderVehicle = vehicles.length > 0 ? vehicles[0] : null;

  // Show loading state while fetching reminder data
  if (isInitialLoading) {
    return (
      <SafeArea style={styles.container} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reminder...</Text>
        </View>
      </SafeArea>
    );
  }

  // Show error if reminder data failed to load
  if (!reminder) {
    return (
      <SafeArea style={styles.container} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load reminder</Text>
          <Text style={styles.errorSubtitle}>Please try again later</Text>
          <TouchableOpacity
            style={styles.errorBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeArea>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Reminder</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {placeholderVehicle && (
          <View style={styles.vehicleInfo}>
            <Ionicons name="car" size={20} color="#3B82F6" />
            <Text style={styles.vehicleName}>
              {placeholderVehicle.year} {placeholderVehicle.make} {placeholderVehicle.model}
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter reminder title"
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            multiline
            numberOfLines={3}
          />

          <Input
            label="Due Date *"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repeat Interval</Text>
            <View style={styles.repeatOptions}>
              {(['none', 'daily', 'weekly', 'monthly', 'yearly', 'mileage'] as RepeatInterval[]).map((interval) => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.repeatOption,
                    repeatInterval === interval && styles.repeatOptionActive
                  ]}
                  onPress={() => setRepeatInterval(interval)}
                >
                  <Text
                    style={[
                      styles.repeatOptionText,
                      repeatInterval === interval && styles.repeatOptionTextActive
                    ]}
                  >
                    {interval === 'none' ? 'One-time' : interval.charAt(0).toUpperCase() + interval.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {repeatInterval === 'mileage' && (
            <Input
              label="Mileage Interval *"
              value={mileageInterval}
              onChangeText={setMileageInterval}
              placeholder="Enter mileage interval"
              keyboardType="numeric"
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={isLoading}
              variant="primary"
            />
            
            <Button
              title={isLoading ? "Deleting..." : "Delete Reminder"}
              onPress={handleDelete}
              disabled={isLoading}
              variant="danger"
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  deleteButton: {
    padding: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  repeatOptionActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  repeatOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  repeatOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  completionSection: {
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  completionTextActive: {
    color: '#10B981',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorBackButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
