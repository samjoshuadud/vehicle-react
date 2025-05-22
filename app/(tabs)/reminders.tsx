import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { reminders, vehicles } from '@/data/dummyData';
import ReminderItem from '@/components/ReminderItem';

export default function RemindersScreen() {
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'overdue'>('all');
  
  // Get today's date for comparison
  const today = new Date();
  
  // Filter reminders based on selected filter
  const filteredReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.date);
    
    if (filterType === 'all') {
      return !reminder.isCompleted;
    } else if (filterType === 'upcoming') {
      return !reminder.isCompleted && reminderDate >= today;
    } else if (filterType === 'overdue') {
      return !reminder.isCompleted && reminderDate < today;
    }
    
    return true;
  });
  
  const handleToggleReminder = (reminderId: string) => {
    // In a real app, this would update the reminder's completion status
    console.log(`Toggle reminder ${reminderId}`);
  };
  
  const handleEditReminder = (reminderId: string) => {
    router.push(`/edit-reminder/${reminderId}`);
  };
  
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
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
            All
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
            Upcoming
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
            Overdue
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
    </SafeAreaView>
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
