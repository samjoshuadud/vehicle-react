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
import { useAuth } from '@/context/AuthContext';
import { apiService, FuelLog } from '@/services/api';
import { convertDistance, convertVolume } from '@/utils/units';

export default function EditFuelLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { statusBarStyle, backgroundColor, currencySymbol, volumeUnit, distanceUnit } = useTheme();
  const { token } = useAuth();
  
  const [fuel, setFuel] = useState<FuelLog | null>(null);
  const [date, setDate] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [isFull, setIsFull] = useState(true);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes for unsaved changes detection
  const [originalData, setOriginalData] = useState<{
    date: string;
    liters: string;
    cost: string;
    location: string;
    isFull: boolean;
    notes: string;
  } | null>(null);

  useEffect(() => {
    const loadFuelLog = async () => {
      if (!id || !token) return;

      try {
        const fuelData = await apiService.getFuelById(token, parseInt(id));
        setFuel(fuelData);
        setDate(fuelData.date);
        // Check if this is electric (has kwh) or gasoline (has liters)
        if (fuelData.kwh !== null && fuelData.kwh !== undefined) {
          setLiters(fuelData.kwh.toString());
        } else if (fuelData.liters !== null && fuelData.liters !== undefined) {
          const litersNumber = Number(fuelData.liters || 0); // fallback to 0
const displayVolume = convertVolume(litersNumber, 'L', volumeUnit);
setLiters(displayVolume.toFixed(2));

        } else {
          setLiters('');
        }
        setCost(fuelData.cost.toString());
        
        setLocation(fuelData.location || '');
        setIsFull(fuelData.full_tank || false);
        setNotes(fuelData.notes || '');

        // Store original data for change detection
        const originalValues = {
          date: fuelData.date,
          liters: fuelData.kwh !== null && fuelData.kwh !== undefined 
            ? fuelData.kwh.toString()
            : fuelData.liters !== null && fuelData.liters !== undefined
            ? convertVolume(Number(fuelData.liters || 0), 'L', volumeUnit).toFixed(2)
            : '',
          cost: fuelData.cost.toString(),
          location: fuelData.location || '',
          isFull: fuelData.full_tank || false,
          notes: fuelData.notes || ''
        };
        setOriginalData(originalValues);
      } catch (error: any) {
        console.error('Failed to load fuel log:', error);
        Alert.alert('Error', 'Failed to load fuel log');
        router.back();
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFuelLog();
  }, [id, token]);

  // Detect unsaved changes
  useEffect(() => {
    if (!originalData) return;
    
    const currentData = {
      date,
      liters,
      cost,
      location,
      isFull,
      notes
    };
    
    const hasChanges = Object.keys(originalData).some(key => 
      originalData[key as keyof typeof originalData] !== currentData[key as keyof typeof currentData]
    );
    
    setHasUnsavedChanges(hasChanges);
  }, [date, liters, cost, location, isFull, notes, originalData]);

  if (isLoadingData) {
    return (
      <SafeArea style={styles.container} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading fuel log...</Text>
        </View>
      </SafeArea>
    );
  }

  if (!fuel) {
    return (
      <SafeArea style={styles.notFoundContainer} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <Text style={styles.notFoundText}>Fuel log not found</Text>
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

    // Validate fuel amount if provided
    let fuelAmount: number | undefined = undefined;
    if (liters) {
      fuelAmount = parseFloat(liters);
      if (isNaN(fuelAmount) || fuelAmount <= 0) {
        Alert.alert('Invalid Fuel Amount', 'Please enter a valid fuel amount');
        return;
      }
    }

    if (!token) {
      Alert.alert('Error', 'Authentication token not found');
      return;
    }

    setIsLoading(true);
    try {
      const updatedData: Partial<FuelLog> = {
        date,
        liters: (!isElectric && fuelAmount !== undefined) ? convertVolume(fuelAmount, volumeUnit, 'L') : undefined,
        kwh: (isElectric && fuelAmount !== undefined) ? fuelAmount : undefined,
        cost: costNum,
        location: location || undefined,
        full_tank: isFull,
        notes: notes || undefined,
      };

      await apiService.updateFuelLog(token, fuel.fuel_id, updatedData);
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      Alert.alert('Success', 'Fuel log updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to update fuel log:', error);
      Alert.alert('Error', error.message || 'Failed to update fuel log');
    } finally {
      setIsLoading(false);
    }
  };



  // Determine if this is an electric vehicle based on which field has data
  const isElectric = fuel ? (fuel.kwh !== null && fuel.kwh !== undefined && fuel.kwh > 0) : false;

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FormHeader 
          title={isElectric ? 'Edit Charging Log' : 'Edit Fuel Log'}
          hasUnsavedChanges={hasUnsavedChanges}
        />

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
                label={`${volumeUnit === 'L' ? 'Liters' : 'Gallons'}`}
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
              label="kWh"
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
            onChangeLocation={(newLocation) => setLocation(newLocation)}
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
              title="Save Changes"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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
    padding: 8,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
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
  unitReminder: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
});
