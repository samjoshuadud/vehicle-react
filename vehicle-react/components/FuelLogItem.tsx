import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FuelLog as APIFuelLog } from '@/services/api';
import { FuelLog as DummyFuelLog } from '../data/dummyData';
import { useTheme } from '@/context/ThemeContext';

// Combined interface that accepts both API and UI formats
type FuelLogCombined = Partial<APIFuelLog> & Partial<DummyFuelLog>;

interface FuelLogItemProps {
  log: FuelLogCombined;
  onPress: () => void;
}

const FuelLogItem: React.FC<FuelLogItemProps> = ({ log, onPress }) => {
  const { currencySymbol } = useTheme();
  
  // Determine if this is an electric vehicle based on kwh field
  const isElectric = log.kwh && log.kwh > 0;
  const amount = isElectric ? log.kwh : log.liters;
  const unit = isElectric ? 'kWh' : 'L';
  const unitLabel = isElectric ? 'kWh' : 'liters';
  
  // Calculate price per unit - handle null/undefined cost and amount values
  const pricePerUnit = (amount && amount > 0 && log.cost && typeof log.cost === 'number') 
    ? (log.cost / amount).toFixed(2) 
    : 'N/A';
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Ionicons 
            name={(amount && amount > 0) ? (isElectric ? 'flash-outline' : 'water-outline') : 'flash-outline'} 
            size={20} 
            color="#F59E0B" 
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            {(amount && amount > 0) ? `${amount.toFixed(1)} ${unitLabel}` : 'Charge'}
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
            <Ionicons name="speedometer-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {(log.mileage !== undefined && log.mileage !== null) 
                ? log.mileage.toLocaleString() 
                : (log.odometer_reading !== undefined && log.odometer_reading !== null) 
                  ? log.odometer_reading.toLocaleString() 
                  : '0'} km
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{log.location}</Text>
          </View>
          
          {(amount && amount > 0) && (
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
