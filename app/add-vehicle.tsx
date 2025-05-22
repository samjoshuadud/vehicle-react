import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { SafeArea } from '@/components/ui/SafeArea';

export default function AddVehicleScreen() {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    // Validate form fields
    if (!make || !model || !year || !licensePlate) {
      // Show error message (in a real app)
      console.log('Please fill in all required fields');
      return;
    }

    // Simulate saving to backend
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Navigate back to dashboard after successful save
      router.back();
    }, 1000);
  };

  return (
    <SafeArea style={styles.container}>
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
          <Text style={styles.headerTitle}>Add Vehicle</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            
            <Input
              label="Make *"
              placeholder="e.g. Toyota"
              value={make}
              onChangeText={setMake}
              leftIcon={<Ionicons name="car-outline" size={20} color="#6B7280" />}
            />
            
            <Input
              label="Model *"
              placeholder="e.g. Camry"
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
              placeholder="e.g. Silver"
              value={color}
              onChangeText={setColor}
              leftIcon={<Ionicons name="color-palette-outline" size={20} color="#6B7280" />}
            />
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Registration Details</Text>
            
            <Input
              label="License Plate *"
              placeholder="e.g. ABC123"
              value={licensePlate}
              onChangeText={setLicensePlate}
              autoCapitalize="characters"
              leftIcon={<Ionicons name="card-outline" size={20} color="#6B7280" />}
            />
            
            <Input
              label="VIN"
              placeholder="Vehicle Identification Number"
              value={vin}
              onChangeText={setVin}
              autoCapitalize="characters"
              leftIcon={<Ionicons name="barcode-outline" size={20} color="#6B7280" />}
            />
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
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
              leftIcon={<Ionicons name="water-outline" size={20} color="#6B7280" />}
            />
            
            <Input
              label="Purchase Date"
              placeholder="YYYY-MM-DD"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              leftIcon={<Ionicons name="calendar-outline" size={20} color="#6B7280" />}
            />
            
            <Input
              label="Vehicle Image URL"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChangeText={setImageUrl}
              keyboardType="url"
              leftIcon={<Ionicons name="image-outline" size={20} color="#6B7280" />}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Save Vehicle"
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
});
