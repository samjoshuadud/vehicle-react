import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaintenanceLog } from '../data/dummyData';
import { useTheme } from '../context/ThemeContext';
import { convertDistance, formatDistance } from '../utils/units';

interface MaintenanceLogItemProps {
  log: MaintenanceLog;
  onPress: () => void;
  onLongPress?: () => void;
  isDeleting?: boolean;
}

const MaintenanceLogItem: React.FC<MaintenanceLogItemProps> = ({ log, onPress, onLongPress, isDeleting = false }) => {
  const { distanceUnit } = useTheme();
  
  // Convert mileage from stored km to user's preferred unit
  const displayMileage = convertDistance(log.mileage, 'km', distanceUnit);
  const formattedMileage = formatDistance(displayMileage, distanceUnit, 0);
  const handlePress = () => {
    // Prevent navigation if currently deleting
    if (isDeleting) return;
    onPress();
  };

  const handleLongPress = () => {
    // Prevent multiple actions if currently deleting
    if (isDeleting || !onLongPress) return;
    onLongPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isDeleting && styles.containerDeleting]} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      disabled={isDeleting}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Ionicons name="construct-outline" size={20} color="#3B82F6" />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{log.type}</Text>
          <Text style={styles.cost}>
            ₱{(log.cost && typeof log.cost === 'number') ? log.cost.toFixed(2) : '0.00'}
          </Text>
        </View>
        
        <Text style={styles.description}>{log.description}</Text>
        
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
            <Text style={styles.detailText}>{formattedMileage}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{log.location}</Text>
          </View>
        </View>
        
        {log.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{log.notes}</Text>
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
  containerDeleting: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
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
    color: '#10B981',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
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
  arrowContainer: {
    justifyContent: 'center',
  },
});

export default MaintenanceLogItem;
