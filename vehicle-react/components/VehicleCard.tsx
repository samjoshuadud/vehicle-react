import React from 'react';
import { StyleSheet, TouchableOpacity, Image, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../services/api';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress }) => {
  const defaultImage = 'https://via.placeholder.com/300x200/E5E7EB/6B7280?text=Vehicle';
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: vehicle.vehicle_image_url || defaultImage }} 
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
            <Text style={styles.detailText}>{vehicle.current_mileage.toLocaleString()} km</Text>
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
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  badgeContainer: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badge: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
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
