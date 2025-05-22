import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import { reminders, vehicles } from '@/data/dummyData';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'mileage';

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Find the reminder based on the ID
  const reminder = reminders.find(r => r.id === id);
  
  // Find the vehicle based on the vehicle ID in the reminder
  const vehicle = reminder ? vehicles.find(v => v.id === reminder.vehicleId) : null;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>('none');
  const [mileageInterval, setMileageInterval] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description);
      setDate(reminder.date);
      setRepeatInterval(reminder.repeatInterval as RepeatInterval || 'none');
      setMileageInterval(reminder.mileageInterval ? reminder.mileageInterval.toString() : '');
      setIsCompleted(reminder.isCompleted);
    }
  }, [reminder]);

  // Handle if reminder not found
  if (!reminder || !vehicle) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Reminder not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    // Validate form fields
    if (!title || !description || !date) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Validate mileage interval if repeat interval is mileage
    if (repeatInterval === 'mileage' && !mileageInterval) {
      Alert.alert('Missing Information', 'Please enter a mileage interval');
      return;
    }

    // Simulate saving to backend
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Navigate back to vehicle detail after successful save
      router.back();
    }, 1000);
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
          onPress: () => {
            // Simulate deleting from backend
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              // Navigate back to vehicle detail after successful delete
              router.back();
            }, 1000);
          }
        }
      ]
    );
  };

  const handleSelectRepeatInterval = (interval: RepeatInterval) => {
    setRepeatInterval(interval);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
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
          <View style={styles.headerRight} />
        </View>

        <View style={styles.vehicleInfo}>
          <Ionicons name="car" size={20} color="#3B82F6" />
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.completedContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setIsCompleted(!isCompleted)}
            >
              <View style={[
                styles.checkbox,
                isCompleted && styles.checkboxCompleted
              ]}>
                {isCompleted && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.completedLabel}>
                Mark as completed
              </Text>
            </TouchableOpacity>
          </View>
          
          <Input
            label="Title *"
            placeholder="e.g. Oil Change, Registration Renewal"
            value={title}
            onChangeText={setTitle}
            leftIcon={<Ionicons name="notifications-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Description *"
            placeholder="Details about the reminder"
            value={description}
            onChangeText={setDescription}
            multiline
            leftIcon={<Ionicons name="document-text-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Due Date *"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
            leftIcon={<Ionicons name="calendar-outline" size={20} color="#6B7280" />}
          />
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Repeat Interval</Text>
            
            <View style={styles.repeatOptions}>
              <TouchableOpacity
                style={[
                  styles.repeatOption,
                  repeatInterval === 'none' && styles.repeatOptionSelected
                ]}
                onPress={() => handleSelectRepeatInterval('none')}
              >
                <Text style={[
                  styles.repeatOptionText,
                  repeatInterval === 'none' && styles.repeatOptionTextSelected
                ]}>
                  None
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.repeatOption,
                  repeatInterval === 'daily' && styles.repeatOptionSelected
                ]}
                onPress={() => handleSelectRepeatInterval('daily')}
              >
                <Text style={[
                  styles.repeatOptionText,
                  repeatInterval === 'daily' && styles.repeatOptionTextSelected
                ]}>
                  Daily
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.repeatOption,
                  repeatInterval === 'weekly' && styles.repeatOptionSelected
                ]}
                onPress={() => handleSelectRepeatInterval('weekly')}
              >
                <Text style={[
                  styles.repeatOptionText,
                  repeatInterval === 'weekly' && styles.repeatOptionTextSelected
                ]}>
                  Weekly
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.repeatOption,
                  repeatInterval === 'monthly' && styles.repeatOptionSelected
                ]}
                onPress={() => handleSelectRepeatInterval('monthly')}
              >
                <Text style={[
                  styles.repeatOptionText,
                  repeatInterval === 'monthly' && styles.repeatOptionTextSelected
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.repeatOption,
                  repeatInterval === 'yearly' && styles.repeatOptionSelected
                ]}
                onPress={() => handleSelectRepeatInterval('yearly')}
              >
                <Text style={[
                  styles.repeatOptionText,
                  repeatInterval === 'yearly' && styles.repeatOptionTextSelected
                ]}>
                  Yearly
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.repeatOption,
                  repeatInterval === 'mileage' && styles.repeatOptionSelected
                ]}
                onPress={() => handleSelectRepeatInterval('mileage')}
              >
                <Text style={[
                  styles.repeatOptionText,
                  repeatInterval === 'mileage' && styles.repeatOptionTextSelected
                ]}>
                  Mileage
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {repeatInterval === 'mileage' && (
            <Input
              label="Mileage Interval *"
              placeholder="e.g. 5000"
              value={mileageInterval}
              onChangeText={setMileageInterval}
              keyboardType="number-pad"
              leftIcon={<Ionicons name="speedometer-outline" size={20} color="#6B7280" />}
            />
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isLoading}
              fullWidth
            />
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete Reminder</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EBF5FF',
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
  completedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  completedLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 12,
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  repeatOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  repeatOptionSelected: {
    backgroundColor: '#EBF5FF',
  },
  repeatOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  repeatOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
});
