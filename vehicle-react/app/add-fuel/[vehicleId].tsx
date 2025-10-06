import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import LocationPicker from '@/components/ui/LocationPicker';
import FormHeader from '@/components/FormHeader';
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
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFull, setIsFull] = useState(true);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track form changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = date.trim() !== '' || 
                      liters.trim() !== '' || 
                      cost.trim() !== '' ||
                      location.trim() !== '' ||
                      !isFull || // Default is true, so any change to false is a change
                      notes.trim() !== '';
    setHasUnsavedChanges(hasChanges);
  }, [date, liters, cost, location, isFull, notes]);

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
    if (!date || !cost || !location) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Validate date format (basic validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format');
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
      let litersInMetric = undefined;
      
      if (!isElectric && liters) {
        const volumeValue = parseFloat(liters);
        litersInMetric = parseFloat(convertVolume(volumeValue, volumeUnit, 'L').toFixed(2));
      }
      
      const fuelData: Partial<FuelLog> = {
        vehicle_id: vehicle.vehicle_id,
        date,
        liters: litersInMetric,
        kwh: (isElectric && liters) ? parseFloat(parseFloat(liters).toFixed(2)) : undefined,
        cost: parseFloat(costNum.toFixed(2)),
        location: location || undefined,
        latitude: locationCoords?.latitude,
        longitude: locationCoords?.longitude,
        full_tank: isFull,
        notes: notes || undefined,
      };

      await apiService.createFuelLog(token, fuelData);
      setHasUnsavedChanges(false); // Reset unsaved changes flag
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
        <FormHeader 
          title={isElectric ? 'Add Charging Log' : 'Add Fuel Log'}
          hasUnsavedChanges={hasUnsavedChanges}
        />

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
          <DatePicker
            label="Date"
            value={date}
            onChangeDate={setDate}
            required
            maximumDate={new Date()}
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
          
          <LocationPicker
            label="Location"
            value={location}
            onChangeLocation={(newLocation, coordinates) => {
              setLocation(newLocation);
              setLocationCoords(coordinates || null);
            }}
            required
            showGasStations={true}
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
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
