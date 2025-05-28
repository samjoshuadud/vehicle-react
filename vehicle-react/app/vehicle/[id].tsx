import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import FuelLogItem from '@/components/FuelLogItem';
import MaintenanceLogItem from '@/components/MaintenanceLogItem';
import ReminderItem from '@/components/ReminderItem';
import { SafeArea } from '@/components/ui/SafeArea';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { useAuth } from '@/context/AuthContext';
import { useReminders } from '@/context/RemindersContext';
import { apiService } from '@/services/api';
import { Vehicle, MaintenanceLog, FuelLog, Reminder as APIReminder } from '@/services/api';
import { Reminder as UIReminder } from '@/data/dummyData';

// Transform API reminder to UI reminder format for vehicle-specific filtering
const transformReminder = (apiReminder: APIReminder): UIReminder => ({
  id: apiReminder.reminder_id.toString(),
  vehicleId: apiReminder.user_id.toString(), // This will be fixed when the API is updated
  title: apiReminder.title,
  description: apiReminder.description || '',
  date: apiReminder.due_date,
  isCompleted: false, // API doesn't have this field yet
  repeatInterval: apiReminder.repeat_interval as any || 'none',
});

type TabType = 'maintenance' | 'fuel' | 'reminders';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('maintenance');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [deletingMaintenanceId, setDeletingMaintenanceId] = useState<string | null>(null);
  const [deletingFuelId, setDeletingFuelId] = useState<string | null>(null);
  const { statusBarStyle, backgroundColor } = useTheme();
  const { vehicles, refreshVehicles } = useVehicles();
  const { token } = useAuth();
  const { reminders, isLoading: isLoadingReminders, refreshReminders } = useReminders();

  // Find the vehicle from context first, then fetch details if needed
  useEffect(() => {
    const loadVehicleData = async () => {
      if (!id || !token) return;

      setIsLoading(true);
      try {
        // First try to find the vehicle in context
        const contextVehicle = vehicles.find(v => v.vehicle_id?.toString() === id);
        if (contextVehicle) {
          setVehicle(contextVehicle);
        } else {
          // If not found in context, fetch from API
          try {
            const vehicleData = await apiService.getVehicleById(token, parseInt(id));
            setVehicle(vehicleData);
          } catch (apiError: any) {
            console.error('Vehicle not found in API:', apiError);
            // Vehicle doesn't exist, navigate back to dashboard
            Alert.alert(
              'Vehicle Not Found', 
              'This vehicle no longer exists.',
              [
                { 
                  text: 'OK', 
                  onPress: () => {
                    router.dismissAll();
                    router.replace('/(tabs)');
                  }
                }
              ]
            );
            return;
          }
        }
      } catch (error: any) {
        console.error('Error loading vehicle:', error);
        Alert.alert('Error', 'Failed to load vehicle details');
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicleData();
  }, [id, vehicles, token]);

  // Load logs when tab changes
  useEffect(() => {
    const loadLogs = async () => {
      if (!id || !vehicle || !token) return;

      setIsLoadingLogs(true);
      try {
        if (activeTab === 'maintenance') {
          const logs = await apiService.getMaintenanceLogs(token, parseInt(id));
          setMaintenanceLogs(logs);
        } else if (activeTab === 'fuel') {
          const logs = await apiService.getFuelLogs(token, parseInt(id));
          setFuelLogs(logs);
        } else if (activeTab === 'reminders') {
          // No need to refresh here - RemindersContext already handles loading
          // Reminders are global, not vehicle-specific (until API is updated)
        }
      } catch (error: any) {
        console.error('Error loading logs:', error);
        // Don't show error for logs as they might not exist yet
      } finally {
        setIsLoadingLogs(false);
      }
    };

    loadLogs();
  }, [activeTab, id, vehicle, token]);
  
  // Handle if vehicle not found or loading
  if (isLoading) {
    return (
      <SafeArea style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </SafeArea>
    );
  }

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

  const handleMaintenanceLongPress = (log: MaintenanceLog) => {
    // Prevent multiple actions if currently deleting
    if (deletingMaintenanceId) return;
    
    Alert.alert(
      'Maintenance Log Actions',
      `What would you like to do with this ${log.maintenance_type} maintenance?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditLog(log.maintenance_id.toString()) },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteMaintenance(log)
        }
      ]
    );
  };

  const handleDeleteMaintenance = (log: MaintenanceLog) => {
    setDeletingMaintenanceId(log.maintenance_id.toString());
    Alert.alert(
      'Delete Maintenance Log',
      `Are you sure you want to delete this ${log.maintenance_type} maintenance log? This action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => setDeletingMaintenanceId(null)
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) {
                throw new Error('No authentication token');
              }
              await apiService.deleteMaintenanceLog(token, log.maintenance_id);
              
              // Remove the deleted log from the state
              setMaintenanceLogs(prevLogs => 
                prevLogs.filter(l => l.maintenance_id !== log.maintenance_id)
              );
              
              Alert.alert('Success', 'Maintenance log deleted successfully');
            } catch (error: any) {
              console.error('Failed to delete maintenance log:', error);
              Alert.alert('Error', error.message || 'Failed to delete maintenance log');
            } finally {
              setDeletingMaintenanceId(null);
            }
          }
        }
      ]
    );
  };
  
  const handleFuelLongPress = (log: FuelLog) => {
    // Prevent multiple actions if currently deleting
    if (deletingFuelId) return;
    
    // Determine if this is for an electric or gasoline vehicle
    const fuelType = vehicle?.fuel_type === 'Electric' ? 'charging' : 'fuel';
    
    Alert.alert(
      'Fuel Log Actions',
      `What would you like to do with this ${fuelType} log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditLog(log.fuel_id.toString()) },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteFuel(log)
        }
      ]
    );
  };

  const handleDeleteFuel = (log: FuelLog) => {
    setDeletingFuelId(log.fuel_id.toString());
    
    // Determine if this is for an electric or gasoline vehicle
    const fuelType = vehicle?.fuel_type === 'Electric' ? 'charging' : 'fuel';
    
    Alert.alert(
      `Delete ${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} Log`,
      `Are you sure you want to delete this ${fuelType} log? This action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => setDeletingFuelId(null)
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) {
                throw new Error('No authentication token');
              }
              await apiService.deleteFuelLog(token, log.fuel_id);
              
              // Remove the deleted log from the state
              setFuelLogs(prevLogs => 
                prevLogs.filter(l => l.fuel_id !== log.fuel_id)
              );
              
              Alert.alert('Success', `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} log deleted successfully`);
            } catch (error: any) {
              console.error(`Failed to delete ${fuelType} log:`, error);
              Alert.alert('Error', error.message || `Failed to delete ${fuelType} log`);
            } finally {
              setDeletingFuelId(null);
            }
          }
        }
      ]
    );
  };
  
  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: vehicle.vehicle_image || 'https://via.placeholder.com/400x200?text=Vehicle' }} 
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
            <Text style={styles.licensePlate}>{vehicle.license_plate}</Text>
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
          <Text style={styles.statValue}>{vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'N/A'}</Text>
          <Text style={styles.statLabel}>Kilometers</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>
            {vehicle.purchase_date ? 
              new Date(vehicle.purchase_date).toLocaleDateString('en-US', { 
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Purchased</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Ionicons name="water-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{vehicle.fuel_type || 'N/A'}</Text>
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
            {isLoadingLogs ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading maintenance logs...</Text>
              </View>
            ) : maintenanceLogs.length > 0 ? (
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {maintenanceLogs.map((log: MaintenanceLog) => (
                  <MaintenanceLogItem 
                    key={log.maintenance_id} 
                    log={{
                      id: log.maintenance_id.toString(),
                      vehicleId: log.vehicle_id.toString(),
                      type: log.maintenance_type,
                      description: log.description,
                      date: log.date,
                      mileage: log.mileage,
                      cost: typeof log.cost === 'number' ? log.cost : (log.cost ? parseFloat(String(log.cost)) : 0),
                      location: log.location || '',
                      notes: log.notes || ''
                    }} 
                    onPress={() => handleEditLog(log.maintenance_id.toString())}
                    onLongPress={() => handleMaintenanceLongPress(log)}
                    isDeleting={deletingMaintenanceId === log.maintenance_id.toString()}
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
            {isLoadingLogs ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading fuel logs...</Text>
              </View>
            ) : fuelLogs.length > 0 ? (
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {fuelLogs.map((log: FuelLog) => (
                  <FuelLogItem 
                    key={log.fuel_id} 
                    log={{
                      id: log.fuel_id.toString(),
                      vehicleId: log.vehicle_id.toString(),
                      date: log.date,
                      mileage: log.odometer_reading || 0,
                      liters: (vehicle?.fuel_type === 'Electric') ? (log.kwh || 0) : (log.liters || 0),
                      kwh: log.kwh || 0,
                      cost: typeof log.cost === 'number' ? log.cost : (log.cost ? parseFloat(String(log.cost)) : 0),
                      location: log.location || '',
                      notes: log.notes || '',
                      isFull: log.full_tank || false // Use the actual full_tank value from the database
                    }} 
                    onPress={() => handleEditLog(log.fuel_id.toString())}
                    onLongPress={() => handleFuelLongPress(log)}
                    isDeleting={deletingFuelId === log.fuel_id.toString()}
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
            {isLoadingLogs || isLoadingReminders ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading reminders...</Text>
              </View>
            ) : (() => {
              // Filter reminders for this vehicle (when API is updated with vehicle_id)
              // For now, show all reminders since the API doesn't have vehicle_id field
              const vehicleReminders = reminders.map(transformReminder);
              
              return vehicleReminders.length > 0 ? (
                <ScrollView 
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {vehicleReminders.map((reminder: UIReminder) => (
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
                  <Text style={styles.emptySubtitle}>Add your first reminder for this vehicle</Text>
                </View>
              );
            })()}
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
    height: 200,
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
    paddingBottom: 42,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
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
