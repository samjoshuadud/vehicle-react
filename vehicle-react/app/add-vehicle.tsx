import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import FormHeader from '@/components/FormHeader';
import { SafeArea } from '@/components/ui/SafeArea';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { convertDistance } from '@/utils/units';

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { statusBarStyle, backgroundColor, distanceUnit } = useTheme();

  // Track form changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = make.trim() !== '' || 
                      model.trim() !== '' || 
                      year.trim() !== '' ||
                      color.trim() !== '' ||
                      licensePlate.trim() !== '' ||
                      vin.trim() !== '' ||
                      mileage.trim() !== '' ||
                      fuelType.trim() !== '' ||
                      purchaseDate.trim() !== '' ||
                      imageUri !== null;
    setHasUnsavedChanges(hasChanges);
  }, [make, model, year, color, licensePlate, vin, mileage, fuelType, purchaseDate, imageUri]);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Pick the image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
          encoding: 'base64',
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

  const { addVehicle } = useVehicles();

  const handleSave = async () => {
    // Validate form fields
    if (!make || !model || !year || !licensePlate) {
      Alert.alert('Error', 'Please fill in all required fields (Make, Model, Year, License Plate)');
      return;
    }

    // Validate year is a valid number
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    // Validate mileage if provided
    if (mileage && (isNaN(parseInt(mileage)) || parseInt(mileage) < 0)) {
      Alert.alert('Error', 'Please enter a valid mileage');
      return;
    }

    setIsLoading(true);
    try {
      // Create vehicle data object
      const vehicleData: any = {
        make: make.trim(),
        model: model.trim(),
        year: yearNum,
        license_plate: licensePlate.trim().toUpperCase(),
      };

      // Add optional fields if they have values
      if (color.trim()) vehicleData.color = color.trim();
      if (vin.trim()) vehicleData.vin = vin.trim();
      if (mileage) {
        const mileageNum = parseInt(mileage);
        // Convert user input to metric units for storage
        const mileageInKm = convertDistance(mileageNum, distanceUnit, 'km');
        vehicleData.current_mileage = mileageInKm;
      }
      if (fuelType.trim()) vehicleData.fuel_type = fuelType.trim();
      if (purchaseDate.trim()) vehicleData.purchase_date = purchaseDate.trim();
      if (base64Image) vehicleData.vehicle_image = base64Image;

      await addVehicle(vehicleData);
      
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      Alert.alert(
        'Success', 
        'Vehicle added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      Alert.alert(
        'Error', 
        error?.message || 'Failed to add vehicle. Please try again.'
      );
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
          title="Add Vehicle"
          hasUnsavedChanges={hasUnsavedChanges}
        />

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
              label={`Current Mileage (${distanceUnit})`}
              placeholder={`e.g. 15000 ${distanceUnit}`}
              value={mileage}
              onChangeText={setMileage}
              keyboardType="number-pad"
              leftIcon={<Ionicons name="speedometer-outline" size={20} color="#6B7280" />}
            />
            <Text style={styles.unitReminder}>
              📏 Distance unit: {distanceUnit === 'km' ? 'Kilometers' : 'Miles'} (Change in Settings)
            </Text>
            
            <Select
              label="Fuel Type"
              value={fuelType}
              onValueChange={setFuelType}
              options={[
                { label: 'Gasoline (Unleaded)', value: 'Gasoline (Unleaded)' },
                { label: 'Gasoline (Premium)', value: 'Gasoline (Premium)' },
                { label: 'Diesel', value: 'Diesel' },
                { label: 'Electric', value: 'Electric' },
                { label: 'Hybrid', value: 'Hybrid' },
                { label: 'Plug-in Hybrid', value: 'Plug-in Hybrid' },
              ]}
              placeholder="Select fuel type"
              leftIcon={<Ionicons name="water-outline" size={20} color="#6B7280" />}
              allowCustom={true}
            />
            
            <DatePicker
              label="Purchase Date"
              value={purchaseDate}
              onChangeDate={setPurchaseDate}
              maximumDate={new Date()}
            />
            
            <Text style={styles.imageNote}>
              💡 Tip: Select an image using the image picker above. Images are stored directly in the app.
            </Text>
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
  imageSection: {
    marginBottom: 24,
  },
  imagePickerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreviewContainer: {
    borderStyle: 'solid',
    borderColor: '#3B82F6',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  imageNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  unitReminder: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
});
