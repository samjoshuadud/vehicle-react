import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useReminders } from '@/context/RemindersContext';
import { useVehicles } from '@/context/VehiclesContext';
import { SafeArea } from '@/components/ui/SafeArea';
import ReminderItem from '@/components/ReminderItem';
import { Reminder as APIReminder } from '@/services/api';
import { Reminder as UIReminder } from '@/data/dummyData';

// Transform API reminder to UI reminder format
const transformReminder = (apiReminder: APIReminder): UIReminder => {
  // Add debug logging
  console.log('API Reminder:', apiReminder);
  console.log('Vehicle ID:', apiReminder.vehicle_id);
  
  return {
    id: apiReminder.reminder_id.toString(),
    vehicleId: apiReminder.vehicle_id?.toString() || '', // Use vehicle_id, fallback to empty string
    title: apiReminder.title,
    description: apiReminder.description || '',
    date: apiReminder.due_date,
    isCompleted: false, // API doesn't have this field yet
    repeatInterval: apiReminder.repeat_interval as any || 'none',
    mileageInterval: apiReminder.mileage_interval || 0,
  };
};

export default function RemindersScreen() {
  const { statusBarStyle, backgroundColor } = useTheme();
  const { 
    reminders, 
    upcomingReminders, 
    overdueReminders, 
    isLoading, 
    refreshReminders,
    deleteReminder
  } = useReminders();
  const { vehicles } = useVehicles();
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'overdue'>('all');
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(null);
  
  // No need for useEffect here - RemindersContext handles initial loading
  // useEffect(() => {
  //   refreshReminders();
  // }, [refreshReminders]);
  
  // Get filtered reminders based on selected filter and transform them
  const getFilteredReminders = () => {
    let apiReminders: APIReminder[] = [];
    switch (filterType) {
      case 'upcoming':
        apiReminders = upcomingReminders;
        break;
      case 'overdue':
        apiReminders = overdueReminders;
        break;
      default:
        apiReminders = reminders;
    }
    return apiReminders.map(transformReminder);
  };
  
  const filteredReminders = getFilteredReminders();
  
  const handleToggleReminder = async (reminderId: string) => {
    // For now, just navigate to edit reminder to mark as complete
    router.push(`/edit-reminder/${reminderId}`);
  };
  
  const handleEditReminder = (reminderId: string) => {
    router.push(`/edit-reminder/${reminderId}`);
  };

  const handleReminderLongPress = (reminderId: string) => {
    const reminder = filteredReminders.find(r => r.id === reminderId);
    if (!reminder) return;

    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteReminder(reminderId),
        },
      ]
    );
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setDeletingReminderId(reminderId);
    try {
      await deleteReminder(parseInt(reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder. Please try again.');
    } finally {
      setDeletingReminderId(null);
    }
  };
  
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.vehicle_id.toString() === vehicleId);
    return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';
  };
  
  if (isLoading) {
    return (
      <SafeArea style={styles.container} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      </SafeArea>
    );
  }
  
  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reminders</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'all' && styles.filterButtonTextActive
            ]}
          >
            All ({reminders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'upcoming' && styles.filterButtonActive
          ]}
          onPress={() => setFilterType('upcoming')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'upcoming' && styles.filterButtonTextActive
            ]}
          >
            Upcoming ({upcomingReminders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'overdue' && styles.filterButtonActive
          ]}
          onPress={() => setFilterType('overdue')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'overdue' && styles.filterButtonTextActive
            ]}
          >
            Overdue ({overdueReminders.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredReminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reminderContainer}>
            <View style={styles.vehicleInfoContainer}>
              <Ionicons name="car-outline" size={16} color="#6B7280" />
              <Text style={styles.vehicleName}>{getVehicleName(item.vehicleId)}</Text>
            </View>
            
            <ReminderItem
              reminder={item}
              onPress={() => handleEditReminder(item.id)}
              onToggleComplete={() => handleToggleReminder(item.id)}
              onLongPress={() => handleReminderLongPress(item.id)}
              isDeleting={deletingReminderId === item.id}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No reminders</Text>
            <Text style={styles.emptySubtitle}>
              {filterType === 'all' 
                ? 'You have no active reminders' 
                : filterType === 'upcoming' 
                  ? 'You have no upcoming reminders' 
                  : 'You have no overdue reminders'}
            </Text>
          </View>
        }
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#EBF5FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  reminderContainer: {
    marginBottom: 16,
  },
  vehicleInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  vehicleName: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
