import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import { vehicles } from '@/data/dummyData';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Find the vehicle based on the ID
  const vehicle = vehicles.find(v => v.id === id);
  
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(vehicle.year.toString());
      setColor(vehicle.color);
      setLicensePlate(vehicle.licensePlate);
      setVin(vehicle.vin);
      setMileage(vehicle.mileage.toString());
      setFuelType(vehicle.fuelType);
      setPurchaseDate(vehicle.purchaseDate);
    }
  }, [vehicle]);

  // Handle if vehicle not found
  if (!vehicle) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Vehicle not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    // Validate form fields
    if (!make || !model || !year) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Validate year format
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year');
      return;
    }

    // Validate mileage format
    if (mileage && isNaN(parseInt(mileage, 10))) {
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
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Simulate deleting from backend
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              // Navigate back to dashboard after successful delete
              router.replace('/(tabs)');
            }, 1000);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
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
          <Text style={styles.headerTitle}>Edit Vehicle</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Make *"
            placeholder="e.g. Toyota, Honda, Ford"
            value={make}
            onChangeText={setMake}
            leftIcon={<Ionicons name="car-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Model *"
            placeholder="e.g. Camry, Civic, F-150"
            value={model}
            onChangeText={setModel}
            leftIcon={<Ionicons name="car-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Year *"
            placeholder="e.g. 2022"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="calendar-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Color"
            placeholder="e.g. Red, Blue, Silver"
            value={color}
            onChangeText={setColor}
            leftIcon={<Ionicons name="color-palette-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="License Plate"
            placeholder="e.g. ABC123"
            value={licensePlate}
            onChangeText={setLicensePlate}
            leftIcon={<Ionicons name="card-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="VIN"
            placeholder="Vehicle Identification Number"
            value={vin}
            onChangeText={setVin}
            leftIcon={<Ionicons name="barcode-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Current Mileage"
            placeholder="e.g. 15000"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="speedometer-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Fuel Type"
            placeholder="e.g. Gasoline, Diesel, Electric"
            value={fuelType}
            onChangeText={setFuelType}
            leftIcon={<Ionicons name="flash-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Purchase Date"
            placeholder="YYYY-MM-DD"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            leftIcon={<Ionicons name="calendar-outline" size={20} color="#6B7280" />}
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
            <Text style={styles.deleteButtonText}>Delete Vehicle</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
});
