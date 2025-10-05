import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FuelLog as APIFuelLog } from '@/services/api';
import { FuelLog as DummyFuelLog } from '../data/dummyData';
import { useTheme } from '@/context/ThemeContext';
import { convertDistance, convertVolume, formatDistance, formatVolume } from '../utils/units';

// Combined interface that accepts both API and UI formats
type FuelLogCombined = Partial<APIFuelLog> & Partial<DummyFuelLog>;

interface FuelLogItemProps {
  log: FuelLogCombined;
  onPress: () => void;
  onLongPress?: () => void;
  isDeleting?: boolean;
}

const FuelLogItem: React.FC<FuelLogItemProps> = ({ 
  log, 
  onPress, 
  onLongPress, 
  isDeleting = false 
}) => {
  const { currencySymbol, distanceUnit, volumeUnit } = useTheme();
  
  // Determine if this is an electric vehicle based on kwh field
  const isElectric = log.kwh !== undefined && log.kwh !== null && log.kwh > 0;
  
  // Safely get amount - make sure we have valid values
  let amount;
  if (isElectric) {
    amount = (log.kwh !== undefined && log.kwh !== null) ? Number(log.kwh) : undefined;
  } else {
    // Convert volume from stored liters to user's preferred unit
    const storedLiters = (log.liters !== undefined && log.liters !== null) ? Number(log.liters) : undefined;
    amount = storedLiters !== undefined ? convertVolume(storedLiters, 'L', volumeUnit) : undefined;
  }
  
  const unit = isElectric ? 'kWh' : volumeUnit;
  const unitLabel = isElectric ? 'kWh' : (volumeUnit === 'L' ? 'liters' : 'gallons');
  
  // Calculate price per unit - handle null/undefined cost and amount values
  const pricePerUnit = (amount !== undefined && amount > 0 && log.cost && typeof log.cost === 'number') 
    ? (log.cost / amount).toFixed(2) 
    : 'N/A';
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isDeleting && styles.deletingContainer
      ]} 
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Ionicons 
            name={(amount !== undefined && amount > 0) 
              ? (isElectric ? 'flash-outline' : 'water-outline') 
              : (isElectric ? 'flash-outline' : 'water-outline')} 
            size={20} 
            color="#F59E0B" 
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            {(amount !== undefined && amount !== null) 
              ? `${Number(amount).toFixed(1)} ${unitLabel}` 
              : isElectric ? 'Charge' : 'Refuel'}
          </Text>
          <Text style={styles.cost}>
            {currencySymbol}{(log.cost && typeof log.cost === 'number') ? log.cost.toFixed(2) : '0.00'}
          </Text>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {log.date ? new Date(log.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{log.location}</Text>
          </View>
          
          {(amount !== undefined && amount > 0) && (
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{currencySymbol}{pricePerUnit}/{unit}</Text>
            </View>
          )}
        </View>
        
        {log.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{log.notes}</Text>
          </View>
        )}
        
        {((log.isFull !== undefined ? log.isFull : log.full_tank) === true) && (
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{isElectric ? 'Full Charge' : 'Full Tank'}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deletingContainer: {
    backgroundColor: '#FEE2E2',
    opacity: 0.7,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  notesContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '500',
  },
  arrowContainer: {
    justifyContent: 'center',
  },
});

export default FuelLogItem;
