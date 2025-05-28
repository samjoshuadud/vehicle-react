import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiService, FuelLog } from '@/services/api';

export default function EditFuelLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { statusBarStyle, backgroundColor, currencySymbol } = useTheme();
  const { token } = useAuth();
  
  const [fuel, setFuel] = useState<FuelLog | null>(null);
  const [date, setDate] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState('');
  const [isFull, setIsFull] = useState(true);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

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
          setLiters(fuelData.liters.toString());
        } else {
          setLiters('');
        }
        setCost(fuelData.cost.toString());
        setMileage(fuelData.odometer_reading.toString());
        setLocation(fuelData.location || '');
        setIsFull(fuelData.full_tank || false);
        setNotes(fuelData.notes || '');
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
        odometer_reading: mileageNum,
        liters: (!isElectric && fuelAmount !== undefined) ? fuelAmount : undefined,
        kwh: (isElectric && fuelAmount !== undefined) ? fuelAmount : undefined,
        cost: costNum,
        location: location || undefined,
        full_tank: isFull,
        notes: notes || undefined,
      };

      await apiService.updateFuelLog(token, fuel.fuel_id, updatedData);
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Fuel Log',
      'Are you sure you want to delete this fuel log? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (!token) {
              Alert.alert('Error', 'Authentication token not found');
              return;
            }

            setIsLoading(true);
            try {
              await apiService.deleteFuelLog(token, fuel.fuel_id);
              Alert.alert('Success', 'Fuel log deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              console.error('Failed to delete fuel log:', error);
              Alert.alert('Error', error.message || 'Failed to delete fuel log');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isElectric ? 'Edit Charging Log' : 'Edit Fuel Log'}</Text>
          <View style={styles.headerRight} />
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
              label="Liters"
              placeholder="Amount of fuel"
              value={liters}
              onChangeText={setLiters}
              keyboardType="decimal-pad"
              leftIcon={<Ionicons name="water-outline" size={20} color="#6B7280" />}
            />
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
          
          <Input
            label="Odometer Reading *"
            placeholder="Current vehicle mileage (km)"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="speedometer-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Location *"
            placeholder={isElectric ? "Where you charged" : "Where you filled up"}
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
              title="Save Changes"
              onPress={handleSave}
              loading={isLoading}
              fullWidth
            />
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>{isElectric ? 'Delete Charging Log' : 'Delete Fuel Log'}</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
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
});
