import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { vehicles } from '@/data/dummyData';

export default function AddFuelLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { statusBarStyle, backgroundColor } = useTheme();
  
  // Find the vehicle based on the ID
  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  const [date, setDate] = useState('');
  const [gallons, setGallons] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState(vehicle?.mileage.toString() || '');
  const [location, setLocation] = useState('');
  const [isFull, setIsFull] = useState(true);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSave = () => {
    // Validate form fields
    if (!date || !cost || !mileage || !location) {
      // Show error message (in a real app)
      console.log('Please fill in all required fields');
      return;
    }

    // For electric vehicles, gallons can be 0
    if (vehicle.fuelType !== 'Electric' && !gallons) {
      console.log('Please enter the amount of fuel');
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

  // Determine if this is an electric vehicle
  const isElectric = vehicle.fuelType === 'Electric';

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
          <Text style={styles.headerTitle}>
            {isElectric ? 'Add Charging Log' : 'Add Fuel Log'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.vehicleInfo}>
          <Ionicons name="car" size={20} color="#F59E0B" />
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Date *"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
            leftIcon={<Ionicons name="calendar-outline" size={20} color="#6B7280" />}
          />
          
          {!isElectric ? (
            <Input
              label="Gallons *"
              placeholder="Amount of fuel"
              value={gallons}
              onChangeText={setGallons}
              keyboardType="decimal-pad"
              leftIcon={<Ionicons name="water-outline" size={20} color="#6B7280" />}
            />
          ) : (
            <Input
              label="kWh (optional)"
              placeholder="Amount of electricity"
              value={gallons}
              onChangeText={setGallons}
              keyboardType="decimal-pad"
              leftIcon={<Ionicons name="flash-outline" size={20} color="#6B7280" />}
            />
          )}
          
          <Input
            label="Cost *"
            placeholder="Total cost in dollars"
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
            leftIcon={<Ionicons name="cash-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Odometer Reading *"
            placeholder="Current vehicle mileage"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="speedometer-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Location *"
            placeholder="Where you filled up"
            value={location}
            onChangeText={setLocation}
            leftIcon={<Ionicons name="location-outline" size={20} color="#6B7280" />}
          />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              {isElectric ? 'Full Charge' : 'Full Tank'}
            </Text>
            <Switch
              value={isFull}
              onValueChange={setIsFull}
              trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
              thumbColor={isFull ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
          
          <Input
            label="Notes"
            placeholder="Additional notes or details"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            leftIcon={<Ionicons name="create-outline" size={20} color="#6B7280" />}
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title={isElectric ? "Save Charging Log" : "Save Fuel Log"}
              onPress={handleSave}
              loading={isLoading}
              fullWidth
              variant={isElectric ? "secondary" : "primary"}
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
    backgroundColor: '#FEF3C7',
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  buttonContainer: {
    marginTop: 24,
  },
});
