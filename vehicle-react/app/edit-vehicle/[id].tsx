import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SafeArea } from '@/components/ui/SafeArea';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { useAuth } from '@/context/AuthContext';
import { Vehicle } from '@/services/api';

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { statusBarStyle, backgroundColor } = useTheme();
  const { vehicles, updateVehicle } = useVehicles();
  const { token } = useAuth();
  
  // Find the vehicle based on the ID
  const vehicle = vehicles.find(v => v.vehicle_id?.toString() === id);
  
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(vehicle.year.toString());
      setColor(vehicle.color || '');
      setLicensePlate(vehicle.license_plate || '');
      setVin(vehicle.vin || '');
      setMileage(vehicle.current_mileage.toString());
      setFuelType(vehicle.fuel_type || '');
      setPurchaseDate(vehicle.purchase_date || '');
      
      // Set existing image if available
      if (vehicle.vehicle_image) {
        setImageUri(vehicle.vehicle_image);
        setBase64Image(vehicle.vehicle_image);
      }
    }
  }, [vehicle]);

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
    const mileageNum = parseInt(mileage, 10);
    if (mileage && isNaN(mileageNum)) {
      Alert.alert('Invalid Mileage', 'Please enter a valid mileage value');
      return;
    }

    if (!vehicle?.vehicle_id) {
      Alert.alert('Error', 'Vehicle ID not found');
      return;
    }

    setIsLoading(true);
    try {
      const updatedData: Partial<Vehicle> = {
        make,
        model,
        year: yearNum,
        color: color || undefined,
        license_plate: licensePlate || undefined,
        vin: vin || undefined,
        current_mileage: mileageNum || 0,
        fuel_type: fuelType || undefined,
        purchase_date: purchaseDate || undefined,
        vehicle_image: base64Image || undefined,
      };

      await updateVehicle(vehicle.vehicle_id, updatedData);
      Alert.alert('Success', 'Vehicle updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to update vehicle:', error);
      Alert.alert('Error', error.message || 'Failed to update vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Pick the image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setImageUri(imageUri);
      
      try {
        // Convert image to base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Add proper data URL prefix for image display
        const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64}`;
        setBase64Image(dataUrl);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        Alert.alert('Error', 'Failed to process the selected image');
      }
    }
  };

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
          <Text style={styles.headerTitle}>Edit Vehicle</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageSection}>
            <TouchableOpacity 
              style={[styles.imagePickerContainer, imageUri && styles.imagePreviewContainer]} 
              onPress={pickImage}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={40} color="#6B7280" />
                  <Text style={styles.imagePickerText}>Tap to select vehicle image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
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
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePickerContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreviewContainer: {
    borderStyle: 'solid',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});
