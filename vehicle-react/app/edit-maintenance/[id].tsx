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
import { useAuth } from '@/context/AuthContext';
import { apiService, MaintenanceLog } from '@/services/api';
import { convertDistance, formatDistance } from '@/utils/units';

export default function EditMaintenanceLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { statusBarStyle, backgroundColor, currencySymbol, distanceUnit } = useTheme();
  const { token } = useAuth();
  
  const [maintenance, setMaintenance] = useState<MaintenanceLog | null>(null);
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  useEffect(() => {
    const loadMaintenanceLog = async () => {
      if (!id || !token) return;

      try {
        const maintenanceData = await apiService.getMaintenanceById(token, parseInt(id));
        setMaintenance(maintenanceData);
        setDate(maintenanceData.date);
        setType(maintenanceData.maintenance_type);
        setDescription(maintenanceData.description);
        
        // Convert stored km to user's preferred unit for display
        const displayMileage = convertDistance(maintenanceData.mileage, 'km', distanceUnit);
        setMileage(Math.round(displayMileage).toString());
        
        setCost(maintenanceData.cost.toString());
        setLocation(maintenanceData.location || '');
        setNotes(maintenanceData.notes || '');
      } catch (error: any) {
        console.error('Failed to load maintenance log:', error);
        Alert.alert('Error', 'Failed to load maintenance log');
        router.back();
      } finally {
        setIsLoadingData(false);
      }
    };

    loadMaintenanceLog();
  }, [id, token]);

  if (isLoadingData) {
    return (
      <SafeArea style={styles.container} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading maintenance log...</Text>
        </View>
      </SafeArea>
    );
  }

  if (!maintenance) {
    return (
      <SafeArea style={styles.notFoundContainer} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <Text style={styles.notFoundText}>Maintenance log not found</Text>
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

    // Validate cost format
    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      Alert.alert('Invalid Cost', 'Please enter a valid cost amount');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication token not found');
      return;
    }

    setIsLoading(true);
    try {
      // Convert user input to metric units for storage
      const mileageInKm = Math.round(convertDistance(mileageNum, distanceUnit, 'km'));
      
      const updatedData: Partial<MaintenanceLog> = {
        date,
        maintenance_type: type,
        description,
        mileage: mileageInKm,
        cost: costNum,
        location: location || undefined,
        notes: notes || undefined,
      };

      await apiService.updateMaintenanceLog(token, maintenance.maintenance_id, updatedData);
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      Alert.alert('Success', 'Maintenance log updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to update maintenance log:', error);
      Alert.alert('Error', error.message || 'Failed to update maintenance log');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Maintenance Log',
      'Are you sure you want to delete this maintenance log? This action cannot be undone.',
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
              await apiService.deleteMaintenanceLog(token, maintenance.maintenance_id);
              Alert.alert('Success', 'Maintenance log deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              console.error('Failed to delete maintenance log:', error);
              Alert.alert('Error', error.message || 'Failed to delete maintenance log');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FormHeader 
          title="Edit Maintenance Log"
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
            <Text style={styles.deleteButtonText}>Delete Maintenance Log</Text>
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
  unitReminder: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
});
