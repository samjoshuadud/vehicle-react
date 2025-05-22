import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reminder } from '../data/dummyData';

interface ReminderItemProps {
  reminder: Reminder;
  onPress: () => void;
  onToggleComplete: () => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ 
  reminder, 
  onPress, 
  onToggleComplete 
}) => {
  // Format the repeat interval for display
  const getRepeatText = () => {
    if (!reminder.repeatInterval || reminder.repeatInterval === 'none') {
      return 'One-time';
    }
    
    if (reminder.repeatInterval === 'mileage' && reminder.mileageInterval) {
      return `Every ${reminder.mileageInterval.toLocaleString()} miles`;
    }
    
    return `Repeats ${reminder.repeatInterval}`;
  };
  
  // Calculate if the reminder is due soon (within 7 days)
  const isDueSoon = () => {
    const dueDate = new Date(reminder.date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };
  
  // Calculate if the reminder is overdue
  const isOverdue = () => {
    const dueDate = new Date(reminder.date);
    const today = new Date();
    return dueDate < today && !reminder.isCompleted;
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        reminder.isCompleted && styles.completedContainer
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={onToggleComplete}
      >
        <View style={[
          styles.checkbox,
          reminder.isCompleted && styles.checkboxCompleted
        ]}>
          {reminder.isCompleted && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={[
            styles.title,
            reminder.isCompleted && styles.completedText
          ]}>
            {reminder.title}
          </Text>
          
          {isOverdue() && (
            <View style={styles.statusContainer}>
              <Text style={styles.overdueText}>Overdue</Text>
            </View>
          )}
          
          {isDueSoon() && !isOverdue() && (
            <View style={[styles.statusContainer, styles.dueSoonContainer]}>
              <Text style={styles.dueSoonText}>Due Soon</Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.description,
          reminder.isCompleted && styles.completedText
        ]}>
          {reminder.description}
        </Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons 
              name="calendar-outline" 
              size={14} 
              color={reminder.isCompleted ? '#9CA3AF' : '#6B7280'} 
            />
            <Text style={[
              styles.detailText,
              reminder.isCompleted && styles.completedDetailText
            ]}>
              {new Date(reminder.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons 
              name="repeat-outline" 
              size={14} 
              color={reminder.isCompleted ? '#9CA3AF' : '#6B7280'} 
            />
            <Text style={[
              styles.detailText,
              reminder.isCompleted && styles.completedDetailText
            ]}>
              {getRepeatText()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.arrowContainer}>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={reminder.isCompleted ? '#D1D5DB' : '#9CA3AF'} 
        />
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
  completedContainer: {
    backgroundColor: '#F9FAFB',
    opacity: 0.8,
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  completedText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  statusContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#EF4444',
  },
  dueSoonContainer: {
    backgroundColor: '#FEF3C7',
  },
  dueSoonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#F59E0B',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  completedDetailText: {
    color: '#9CA3AF',
  },
  arrowContainer: {
    justifyContent: 'center',
  },
});

export default ReminderItem;
