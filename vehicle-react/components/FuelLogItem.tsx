import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FuelLog } from '../data/dummyData';
import { useTheme } from '@/context/ThemeContext';

interface FuelLogItemProps {
  log: FuelLog;
  onPress: () => void;
}

const FuelLogItem: React.FC<FuelLogItemProps> = ({ log, onPress }) => {
  const { currencySymbol } = useTheme();
  
  // Calculate price per liter
  const pricePerLiter = log.liters > 0 ? (log.cost / log.liters).toFixed(2) : 'N/A';
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Ionicons 
            name={log.liters === 0 ? 'flash-outline' : 'water-outline'} 
            size={20} 
            color="#F59E0B" 
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            {log.liters > 0 ? `${log.liters.toFixed(1)} liters` : 'Charge'}
          </Text>
          <Text style={styles.cost}>{currencySymbol}{log.cost.toFixed(2)}</Text>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {new Date(log.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{log.mileage.toLocaleString()} km</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{log.location}</Text>
          </View>
          
          {log.liters > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{currencySymbol}{pricePerLiter}/L</Text>
            </View>
          )}
        </View>
        
        {log.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{log.notes}</Text>
          </View>
        )}
        
        {log.isFull && (
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>Full Tank</Text>
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
