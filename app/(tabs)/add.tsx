import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { vehicles } from '@/data/dummyData';

export default function AddScreen() {
  const handleAddVehicle = () => {
    router.push('/add-vehicle');
  };
  
  const handleAddMaintenance = (vehicleId: string) => {
    router.push(`/add-maintenance/${vehicleId}`);
  };
  
  const handleAddFuel = (vehicleId: string) => {
    router.push(`/add-fuel/${vehicleId}`);
  };
  
  const handleAddReminder = (vehicleId: string) => {
    router.push(`/add-reminder/${vehicleId}`);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddVehicle}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="car" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Add New Vehicle</Text>
              <Text style={styles.buttonDescription}>
                Add a new vehicle to your garage
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        {vehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add to Existing Vehicle</Text>
            
            {vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicleSection}>
                <View style={styles.vehicleHeader}>
                  <Ionicons name="car-outline" size={18} color="#3B82F6" />
                  <Text style={styles.vehicleName}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                </View>
                
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleAddMaintenance(vehicle.id)}
                  >
                    <View style={[styles.actionIconContainer, styles.maintenanceIcon]}>
                      <Ionicons name="build" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionButtonText}>Maintenance</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleAddFuel(vehicle.id)}
                  >
                    <View style={[styles.actionIconContainer, styles.fuelIcon]}>
                      <Ionicons name="flash" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionButtonText}>Fuel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleAddReminder(vehicle.id)}
                  >
                    <View style={[styles.actionIconContainer, styles.reminderIcon]}>
                      <Ionicons name="notifications" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionButtonText}>Reminder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {vehicles.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a vehicle to start tracking maintenance, fuel, and reminders
            </Text>
          </View>
        )}
      </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  vehicleSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  maintenanceIcon: {
    backgroundColor: '#10B981',
  },
  fuelIcon: {
    backgroundColor: '#F59E0B',
  },
  reminderIcon: {
    backgroundColor: '#6366F1',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#4B5563',
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
    textAlign: 'center',
  },
});
