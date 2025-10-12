import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Modal } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import FormHeader from '@/components/FormHeader';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { useReminders } from '@/context/RemindersContext';
import { MAINTENANCE_TEMPLATES, MaintenanceTemplate, formatInterval } from '@/utils/maintenanceTemplates';
type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'mileage';

export default function AddReminderScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { statusBarStyle, backgroundColor } = useTheme();
  const { vehicles } = useVehicles();
  const { createReminder } = useReminders();
  
  // Find the vehicle based on the ID
  const vehicle = vehicles.find(v => v.vehicle_id.toString() === vehicleId);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>('none');
  const [mileageInterval, setMileageInterval] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Track form changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = title.trim() !== '' || 
                      description.trim() !== '' || 
                      date.trim() !== '' ||
                      repeatInterval !== 'none' ||
                      mileageInterval.trim() !== '';
    setHasUnsavedChanges(hasChanges);
  }, [title, description, date, repeatInterval, mileageInterval]);

  // Handle if vehicle not found
  if (!vehicle) {
    return (
      <SafeArea style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Vehicle not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeArea>
    );
  }

  const handleSave = async () => {
    // Validate form fields
    if (!title || !description || !date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    // Validate mileage interval if repeat interval is mileage
    if (repeatInterval === 'mileage' && !mileageInterval) {
      Alert.alert('Error', 'Please enter a mileage interval');
      return;
    }

    setIsLoading(true);
    try {
      const reminderData: any = {
        title,
        description,
        due_date: date,
        repeat_interval: repeatInterval === 'none' ? undefined : repeatInterval,
        vehicle_id: parseInt(vehicleId!, 10),  // Add vehicle_id from URL parameter
      };

      // Add mileage_interval if repeat interval is mileage
      if (repeatInterval === 'mileage' && mileageInterval) {
        reminderData.mileage_interval = parseInt(mileageInterval, 10);
      }

      await createReminder(reminderData);
      
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      Alert.alert('Success', 'Reminder created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRepeatInterval = (interval: RepeatInterval) => {
    setRepeatInterval(interval);
  };

  const handleSelectTemplate = (template: MaintenanceTemplate) => {
    setTitle(template.title);
    setDescription(template.description);
    setRepeatInterval(template.defaultInterval);
    
    // Calculate suggested due date (template intervalMonths from today)
    const today = new Date();
    const suggestedDate = new Date(today);
    suggestedDate.setMonth(suggestedDate.getMonth() + template.intervalMonths);
    setDate(suggestedDate.toISOString().split('T')[0]);
    
    setShowTemplates(false);
    setHasUnsavedChanges(true);
  };

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FormHeader 
          title="Add Reminder"
          hasUnsavedChanges={hasUnsavedChanges}
        />

        <View style={styles.vehicleInfo}>
          <Ionicons name="car" size={20} color="#3B82F6" />
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
        </View>

        {/* Quick Setup Button */}
        <TouchableOpacity 
          style={styles.quickSetupButton}
          onPress={() => setShowTemplates(true)}
        >
          <Ionicons name="flash" size={20} color="#3B82F6" />
          <Text style={styles.quickSetupText}>Quick Setup - Maintenance Templates</Text>
          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
            leftIcon={<Ionicons name="document-text-outline" size={20} color="#6B7280" />}
          />
          
          <DatePicker
            label="Due Date"
            value={date}
            onChangeDate={setDate}
            minimumDate={new Date()}
            required
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
              title="Save Reminder"
              onPress={handleSave}
              loading={isLoading}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maintenance Templates</Text>
              <TouchableOpacity onPress={() => setShowTemplates(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.categoryTitle}>⚙️ Routine Maintenance</Text>
              {MAINTENANCE_TEMPLATES.filter(t => t.category === 'routine').map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <View style={styles.templateIcon}>
                    <Ionicons name={template.icon as any} size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <Text style={styles.templateInterval}>{formatInterval(template.intervalMonths)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}

              <Text style={styles.categoryTitle}>📅 Periodic Maintenance</Text>
              {MAINTENANCE_TEMPLATES.filter(t => t.category === 'periodic').map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <View style={styles.templateIcon}>
                    <Ionicons name={template.icon as any} size={24} color="#8B5CF6" />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <Text style={styles.templateInterval}>{formatInterval(template.intervalMonths)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}

              <Text style={styles.categoryTitle}>🗓️ Annual Maintenance</Text>
              {MAINTENANCE_TEMPLATES.filter(t => t.category === 'seasonal').map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <View style={styles.templateIcon}>
                    <Ionicons name={template.icon as any} size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <Text style={styles.templateInterval}>{formatInterval(template.intervalMonths)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeArea>
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
  },
  quickSetupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickSetupText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalScroll: {
    padding: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  templateInterval: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
});
