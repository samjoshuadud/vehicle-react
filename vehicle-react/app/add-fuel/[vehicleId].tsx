import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { useAuth } from '@/context/AuthContext';
import { apiService, FuelLog } from '@/services/api';
import { convertDistance, convertVolume } from '@/utils/units';

export default function AddFuelLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { statusBarStyle, backgroundColor, currencySymbol, volumeUnit, distanceUnit } = useTheme();
  const { vehicles } = useVehicles();
  const { token } = useAuth();
  
  // Find the vehicle based on the ID
  const vehicle = vehicles.find(v => v.vehicle_id?.toString() === vehicleId);
  
  const [date, setDate] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState(vehicle?.current_mileage.toString() || '');
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

  const handleSave = async () => {
    // Validate form fields
    if (!date || !cost || !mileage) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Validate date format (basic validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    // Validate mileage format
    const mileageNum = parseInt(mileage, 10);
    if (isNaN(mileageNum) || mileageNum < 0) {
      Alert.alert('Invalid Mileage', 'Please enter a valid mileage value');
      return;
    }

    // Validate cost format
    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      Alert.alert('Invalid Cost', 'Please enter a valid cost amount');
      return;
    }

    // For non-electric vehicles, validate fuel amount
    if (vehicle?.fuel_type !== 'Electric' && liters) {
      const litersNum = parseFloat(liters);
      if (isNaN(litersNum) || litersNum <= 0) {
        Alert.alert('Invalid Fuel Amount', 'Please enter a valid fuel amount');
        return;
      }
    }

    if (!vehicle?.vehicle_id || !token) {
      Alert.alert('Error', 'Vehicle or authentication information not found');
      return;
    }

    setIsLoading(true);
    try {
      // Convert user input to metric units for storage
      const mileageInKm = convertDistance(mileageNum, distanceUnit, 'km');
      let litersInMetric = undefined;
      
      if (!isElectric && liters) {
        const volumeValue = parseFloat(liters);
        litersInMetric = convertVolume(volumeValue, volumeUnit, 'L');
      }
      
      const fuelData: Partial<FuelLog> = {
        vehicle_id: vehicle.vehicle_id,
        date,
        odometer_reading: mileageInKm,
        liters: litersInMetric,
        kwh: (isElectric && liters) ? parseFloat(liters) : undefined,
        cost: costNum,
        location: location || undefined,
        full_tank: isFull,
        notes: notes || undefined,
      };

      await apiService.createFuelLog(token, fuelData);
      Alert.alert('Success', 'Fuel log added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to create fuel log:', error);
      Alert.alert('Error', error.message || 'Failed to add fuel log');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if this is an electric vehicle
  const isElectric = vehicle?.fuel_type === 'Electric';

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>{isElectric ? 'Add Charging Log' : 'Add Fuel Log'}</Text>
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
            <>
              <Input
                label={`${volumeUnit === 'L' ? 'Liters' : 'Gallons'} *`}
                placeholder="Amount of fuel"
                value={liters}
                onChangeText={setLiters}
                keyboardType="decimal-pad"
                leftIcon={<Ionicons name="water-outline" size={20} color="#6B7280" />}
              />
              <Text style={styles.unitReminder}>
                ⛽ Volume unit: {volumeUnit === 'L' ? 'Liters' : 'Gallons'} (Change in Settings)
              </Text>
            </>
          ) : (
            <Input
              label="kWh (optional)"
              placeholder="Amount of electricity"
              value={liters}
              onChangeText={setLiters}
              keyboardType="decimal-pad"
              leftIcon={<Ionicons name="flash-outline" size={20} color="#6B7280" />}
            />
          )}
          
          <Input
            label="Cost *"
            placeholder={`Total cost in ${currencySymbol}`}
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
            leftIcon={<Ionicons name="cash-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Odometer Reading *"
            placeholder={`Current vehicle mileage (${distanceUnit})`}
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="speedometer-outline" size={20} color="#6B7280" />}
          />
          <Text style={styles.unitReminder}>
            📏 Distance unit: {distanceUnit === 'km' ? 'Kilometers' : 'Miles'} (Change in Settings)
          </Text>
          
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
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
  unitReminder: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
});
