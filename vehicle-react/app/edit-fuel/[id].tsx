import { SafeArea } from '@/components/ui/SafeArea';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { vehicles, fuelLogs } from '@/data/dummyData';

export default function EditFuelLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { statusBarStyle, backgroundColor, currencySymbol } = useTheme();
  
  // Find the log and associated vehicle
  const log = fuelLogs.find(l => l.id === id);
  const vehicle = log ? vehicles.find(v => v.id === log.vehicleId) : null;
  
  const [date, setDate] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState('');
  const [isFull, setIsFull] = useState(true);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (log) {
      setDate(log.date);
      setLiters(log.liters.toString());
      setCost(log.cost.toString());
      setMileage(log.mileage.toString());
      setLocation(log.location || '');
      setIsFull(log.isFull);
      setNotes(log.notes || '');
    }
  }, [log]);

  // Handle if log not found
  if (!log || !vehicle) {
    return (
      <SafeArea style={styles.notFoundContainer}>
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

  const handleSave = () => {
    // Validate form fields
    if (!date || !cost || !mileage) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Validate numeric fields
    if (vehicle.fuelType !== 'Electric') {
      if (isNaN(parseFloat(liters)) || parseFloat(liters) <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid fuel amount in liters');
        return;
      }
    }

    if (isNaN(parseFloat(cost)) || parseFloat(cost) <= 0) {
      Alert.alert('Invalid Cost', 'Please enter a valid cost value');
      return;
    }

    if (isNaN(parseInt(mileage, 10))) {
      Alert.alert('Invalid Mileage', 'Please enter a valid mileage value');
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Fuel Log',
      'Are you sure you want to delete this fuel log? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              router.back();
            }, 1000);
          }
        }
      ]
    );
  };

  // Calculate fuel economy if possible
  const calculateFuelEconomy = () => {
    // In a real app, this would look at previous fuel logs to calculate km/Liters
    return vehicle.fuelType === 'Electric' ? 'N/A' : '10.7 km/Liters';
  };

  const isElectric = vehicle.fuelType === 'Electric';

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Edit {isElectric ? 'Charging' : 'Fuel'} Log</Text>
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
          
          {!isElectric && (
            <Input
              label="Liters *"
              placeholder="Amount of fuel"
              value={liters}
              onChangeText={setLiters}
              keyboardType="decimal-pad"
              leftIcon={<Ionicons name="water-outline" size={20} color="#6B7280" />}
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
            label="Location"
            placeholder="Where you filled up"
            value={location}
            onChangeText={setLocation}
            leftIcon={<Ionicons name="location-outline" size={20} color="#6B7280" />}
          />
          
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Ionicons name="water-outline" size={20} color="#6B7280" />
              <Text style={styles.switchLabel}>Filled tank completely</Text>
            </View>
            <Switch
              value={isFull}
              onValueChange={setIsFull}
              trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
              thumbColor={isFull ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
          
          <Input
            label="Notes"
            placeholder="Additional notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            leftIcon={<Ionicons name="create-outline" size={20} color="#6B7280" />}
          />
          
          <View style={styles.fuelEconomyContainer}>
            <Text style={styles.fuelEconomyLabel}>Estimated Fuel Economy:</Text>
            <Text style={styles.fuelEconomyValue}>{calculateFuelEconomy()}</Text>
          </View>
          
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
            <Text style={styles.deleteButtonText}>Delete Fuel Log</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
  },
  fuelEconomyContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fuelEconomyLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  fuelEconomyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  buttonContainer: {
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
});
