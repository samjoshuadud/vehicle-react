import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FuelLogItem from '@/components/FuelLogItem';
import MaintenanceLogItem from '@/components/MaintenanceLogItem';
import ReminderItem from '@/components/ReminderItem';
import { SafeArea } from '@/components/ui/SafeArea';
import { useTheme } from '@/context/ThemeContext';
import { fuelLogs, maintenanceLogs, reminders, vehicles } from '@/data/dummyData';
type TabType = 'maintenance' | 'fuel' | 'reminders';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('maintenance');
  const { statusBarStyle, backgroundColor } = useTheme();
  
  // Find the vehicle based on the ID
  const vehicle = vehicles.find(v => v.id === id);
  
  // Filter logs and reminders for this vehicle
  const vehicleMaintenanceLogs = maintenanceLogs.filter(log => log.vehicleId === id);
  const vehicleFuelLogs = fuelLogs.filter(log => log.vehicleId === id);
  const vehicleReminders = reminders.filter(reminder => reminder.vehicleId === id);
  
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
  
  const handleEditVehicle = () => {
    router.push(`/edit-vehicle/${id}`);
  };
  
  const handleAddLog = () => {
    if (activeTab === 'maintenance') {
      router.push(`/add-maintenance/${id}`);
    } else if (activeTab === 'fuel') {
      router.push(`/add-fuel/${id}`);
    } else if (activeTab === 'reminders') {
      router.push(`/add-reminder/${id}`);
    }
  };
  
  const handleEditLog = (logId: string) => {
    if (activeTab === 'maintenance') {
      router.push(`/edit-maintenance/${logId}`);
    } else if (activeTab === 'fuel') {
      router.push(`/edit-fuel/${logId}`);
    } else if (activeTab === 'reminders') {
      router.push(`/edit-reminder/${logId}`);
    }
  };
  
  const handleToggleReminder = (reminderId: string) => {
    // In a real app, this would update the reminder's completion status
    console.log(`Toggle reminder ${reminderId}`);
  };
  
  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: vehicle.image }} 
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
            <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditVehicle}
          >
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Vehicle Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{vehicle.mileage.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Miles</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>
            {new Date(vehicle.purchaseDate).toLocaleDateString('en-US', { 
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.statLabel}>Purchased</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Ionicons name="water-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{vehicle.fuelType}</Text>
          <Text style={styles.statLabel}>Fuel Type</Text>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'maintenance' && styles.activeTab
          ]}
          onPress={() => setActiveTab('maintenance')}
        >
          <Ionicons 
            name="construct-outline" 
            size={20} 
            color={activeTab === 'maintenance' ? '#3B82F6' : '#6B7280'} 
          />
          <Text 
            style={[
              styles.tabText,
              activeTab === 'maintenance' && styles.activeTabText
            ]}
          >
            Maintenance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'fuel' && styles.activeTab
          ]}
          onPress={() => setActiveTab('fuel')}
        >
          <Ionicons 
            name="flash-outline" 
            size={20} 
            color={activeTab === 'fuel' ? '#3B82F6' : '#6B7280'} 
          />
          <Text 
            style={[
              styles.tabText,
              activeTab === 'fuel' && styles.activeTabText
            ]}
          >
            Fuel
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'reminders' && styles.activeTab
          ]}
          onPress={() => setActiveTab('reminders')}
        >
          <Ionicons 
            name="notifications-outline" 
            size={20} 
            color={activeTab === 'reminders' ? '#3B82F6' : '#6B7280'} 
          />
          <Text 
            style={[
              styles.tabText,
              activeTab === 'reminders' && styles.activeTabText
            ]}
          >
            Reminders
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'maintenance' && (
          <>
            {vehicleMaintenanceLogs.length > 0 ? (
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {vehicleMaintenanceLogs.map(log => (
                  <MaintenanceLogItem 
                    key={log.id} 
                    log={log} 
                    onPress={() => handleEditLog(log.id)} 
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No maintenance logs yet</Text>
                <Text style={styles.emptySubtitle}>Add your first maintenance log</Text>
              </View>
            )}
          </>
        )}
        
        {activeTab === 'fuel' && (
          <>
            {vehicleFuelLogs.length > 0 ? (
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {vehicleFuelLogs.map(log => (
                  <FuelLogItem 
                    key={log.id} 
                    log={log} 
                    onPress={() => handleEditLog(log.id)} 
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="flash-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No fuel logs yet</Text>
                <Text style={styles.emptySubtitle}>Add your first fuel log</Text>
              </View>
            )}
          </>
        )}
        
        {activeTab === 'reminders' && (
          <>
            {vehicleReminders.length > 0 ? (
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {vehicleReminders.map(reminder => (
                  <ReminderItem 
                    key={reminder.id} 
                    reminder={reminder} 
                    onPress={() => handleEditLog(reminder.id)}
                    onToggleComplete={() => handleToggleReminder(reminder.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No reminders yet</Text>
                <Text style={styles.emptySubtitle}>Add your first reminder</Text>
              </View>
            )}
          </>
        )}
      </View>
      
      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddLog}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  header: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  licensePlate: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#EBF5FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#3B82F6',
  },
  contentContainer: {
    flex: 1,
    marginTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80, // Add padding for the floating button
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
