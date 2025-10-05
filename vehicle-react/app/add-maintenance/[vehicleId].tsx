import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import LocationPicker from '@/components/ui/LocationPicker';
import FormHeader from '@/components/FormHeader';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { useAuth } from '@/context/AuthContext';
import { apiService, MaintenanceLog } from '@/services/api';
import { convertDistance } from '@/utils/units';

export default function AddMaintenanceLogScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { statusBarStyle, backgroundColor, currencySymbol, distanceUnit } = useTheme();
  const { vehicles, refreshVehicles } = useVehicles();
  const { token } = useAuth();
  
  // Find the vehicle based on the ID
  const vehicle = vehicles.find(v => v.vehicle_id?.toString() === vehicleId);
  
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [mileage, setMileage] = useState(vehicle?.current_mileage.toString() || '');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track form changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = date.trim() !== '' || 
                      type.trim() !== '' || 
                      description.trim() !== '' ||
                      mileage !== (vehicle?.current_mileage.toString() || '') ||
                      cost.trim() !== '' ||
                      location.trim() !== '' ||
                      notes.trim() !== '';
    setHasUnsavedChanges(hasChanges);
  }, [date, type, description, mileage, cost, location, notes, vehicle?.current_mileage]);

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
    if (!date || !type || !description || !mileage || !cost || !location) {
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

    // Convert to km for comparison with vehicle's stored mileage
    const mileageInKm = Math.round(convertDistance(mileageNum, distanceUnit, 'km'));
    const currentMileageKm = vehicle?.current_mileage || 0;

    // Validate mileage is not going backwards
    if (mileageInKm < currentMileageKm) {
      Alert.alert(
        'Mileage Warning',
        `The entered mileage (${mileageNum.toLocaleString()} ${distanceUnit}) is less than the current vehicle mileage (${Math.round(convertDistance(currentMileageKm, 'km', distanceUnit)).toLocaleString()} ${distanceUnit}).\n\nAre you sure this is correct?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => proceedWithSave(mileageInKm) }
        ]
      );
      return;
    }

    // Validate mileage is not suspiciously high (more than 5000 km increase)
    if (mileageInKm > currentMileageKm + 5000) {
      Alert.alert(
        'Unusually High Mileage',
        `The entered mileage (${mileageNum.toLocaleString()} ${distanceUnit}) is significantly higher than the current vehicle mileage (${Math.round(convertDistance(currentMileageKm, 'km', distanceUnit)).toLocaleString()} ${distanceUnit}).\n\nPlease verify this is correct.`,
        [
          { text: 'Let me check', style: 'cancel' },
          { text: 'It\'s Correct', onPress: () => proceedWithSave(mileageInKm) }
        ]
      );
      return;
    }

    // Mileage is valid, proceed with save
    proceedWithSave(mileageInKm);
  };

  const proceedWithSave = async (mileageInKm: number) => {
    // Validate cost format
    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      Alert.alert('Invalid Cost', 'Please enter a valid cost amount');
      return;
    }

    if (!vehicle?.vehicle_id || !token) {
      Alert.alert('Error', 'Vehicle or authentication information not found');
      return;
    }

    setIsLoading(true);
    try {
      
      const maintenanceData: Partial<MaintenanceLog> = {
        vehicle_id: vehicle.vehicle_id,
        date,
        maintenance_type: type, // Map 'type' to 'maintenance_type' for backend
        description,
        mileage: mileageInKm,
        cost: costNum,
        location: location || undefined,
        notes: notes || undefined,
      };

      await apiService.createMaintenanceLog(token, maintenanceData);
      await refreshVehicles(); // Refresh to show updated mileage
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      Alert.alert('Success', 'Maintenance log added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to create maintenance log:', error);
      Alert.alert('Error', error.message || 'Failed to add maintenance log');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FormHeader 
          title="Add Maintenance Log"
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
          
          <Select
            label="Maintenance Type"
            value={type}
            onValueChange={setType}
            options={[
              { label: 'Oil Change', value: 'Oil Change' },
              { label: 'Tire Rotation', value: 'Tire Rotation' },
              { label: 'Brake Service', value: 'Brake Service' },
              { label: 'Air Filter Replacement', value: 'Air Filter Replacement' },
              { label: 'Battery Replacement', value: 'Battery Replacement' },
              { label: 'Transmission Service', value: 'Transmission Service' },
              { label: 'Coolant Flush', value: 'Coolant Flush' },
              { label: 'Spark Plug Replacement', value: 'Spark Plug Replacement' },
              { label: 'Brake Pad Replacement', value: 'Brake Pad Replacement' },
              { label: 'Wheel Alignment', value: 'Wheel Alignment' },
              { label: 'Inspection', value: 'Inspection' },
            ]}
            placeholder="Select maintenance type"
            required
            leftIcon={<Ionicons name="construct-outline" size={20} color="#6B7280" />}
            allowCustom={true}
          />
          
          <Input
            label="Description *"
            placeholder="Brief description of the maintenance"
            value={description}
            onChangeText={setDescription}
            leftIcon={<Ionicons name="document-text-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label={`Mileage (${distanceUnit}) *`}
            placeholder={`Current vehicle mileage (${distanceUnit})`}
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="speedometer-outline" size={20} color="#6B7280" />}
          />
          <View style={styles.hintContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.hintText}>
              Current vehicle mileage: {vehicle?.current_mileage ? Math.round(convertDistance(vehicle.current_mileage, 'km', distanceUnit)).toLocaleString() : '0'} {distanceUnit}
            </Text>
          </View>
          <Text style={styles.unitReminder}>
            📏 Distance unit: {distanceUnit === 'km' ? 'Kilometers' : 'Miles'} (Change in Settings)
          </Text>
          
          <Input
            label="Cost *"
            placeholder={`Cost in ${currencySymbol}`}
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
            leftIcon={<Ionicons name="cash-outline" size={20} color="#6B7280" />}
          />
          
          <LocationPicker
            label="Location"
            value={location}
            onChangeLocation={(newLocation) => setLocation(newLocation)}
            required
          />
          
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
              title="Save Maintenance Log"
              onPress={handleSave}
              loading={isLoading}
              fullWidth
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 4,
    gap: 6,
  },
  hintText: {
    fontSize: 13,
    color: '#0369A1',
    flex: 1,
    fontWeight: '500',
  },
});
