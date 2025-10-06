import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image, View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../services/api';
import { useVehicles } from '../context/VehiclesContext';
import { useTheme } from '../context/ThemeContext';
import { convertDistance, formatDistance } from '../utils/units';
import { router } from 'expo-router';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress }) => {
  const defaultImage = 'https://via.placeholder.com/300x200/E5E7EB/6B7280?text=Vehicle';
  const { deleteVehicle } = useVehicles();
  const { distanceUnit } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Convert mileage to user's preferred unit (assuming stored value is in km)
  const displayMileage = convertDistance(vehicle.current_mileage, 'km', distanceUnit);
  const formattedMileage = formatDistance(displayMileage, distanceUnit, 0);
  
  const handlePress = () => {
    // Prevent navigation if currently deleting
    if (isDeleting) return;
    onPress();
  };
  
  const handleLongPress = () => {
    // Prevent multiple actions if currently deleting
    if (isDeleting) return;
    
    Alert.alert(
      'Vehicle Actions',
      `What would you like to do with ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => router.push(`/edit-vehicle/${vehicle.vehicle_id}`) },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDelete()
        }
      ]
    );
  };

  const handleDelete = () => {
    setIsDeleting(true);
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => setIsDeleting(false)
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.vehicle_id);
              // Clear any navigation stack that might reference this vehicle
              if (router.canGoBack()) {
                router.dismissAll();
              }
              // Navigate to main dashboard to ensure clean state
              router.replace('/(tabs)');
              // Small delay before showing success message
              setTimeout(() => {
                Alert.alert('Success', 'Vehicle deleted successfully');
              }, 200);
            } catch (error: any) {
              console.error('Failed to delete vehicle:', error);
              Alert.alert('Error', error.message || 'Failed to delete vehicle');
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  return (
    <TouchableOpacity 
      style={[styles.card, isDeleting && styles.cardDeleting]} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      disabled={isDeleting}
    >
      <Image 
        source={{ uri: vehicle.vehicle_image || defaultImage }} 
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>{vehicle.fuel_type || 'Gasoline'}</Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={16} color="#4B5563" />
            <Text style={styles.detailText}>{formattedMileage}</Text>
          </View>
          
          {vehicle.purchase_date && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#4B5563" />
              <Text style={styles.detailText}>
                Since {new Date(vehicle.purchase_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          )}
          
          {vehicle.license_plate && (
            <View style={styles.detailItem}>
              <Ionicons name="car-outline" size={16} color="#4B5563" />
              <Text style={styles.detailText}>{vehicle.license_plate}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardDeleting: {
    opacity: 0.5,
  },
  image: {
    width: 100,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    flexShrink: 1,
  },
  badgeContainer: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: 110,
    flexShrink: 0,
    marginLeft: 8,
  },
  badge: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingRight: 12,
  },
});

export default VehicleCard;
