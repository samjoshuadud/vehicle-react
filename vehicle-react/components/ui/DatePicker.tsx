import React, { useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, Modal, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerProps {
  label: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onChangeDate: (date: string) => void;
  required?: boolean;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export default function DatePicker({
  label,
  value,
  onChangeDate,
  required = false,
  error,
  maximumDate,
  minimumDate,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const webInputRef = useRef<any>(null);
  
  // Parse the ISO date string to Date object, or use current date as default
  const getDateValue = (): Date => {
    if (value && value.trim() !== '') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  };

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      
      // Only update if user selected a date (not dismissed)
      if (event.type === 'set' && selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        onChangeDate(formattedDate);
      }
    } else if (Platform.OS === 'ios') {
      // On iOS, update temp date as user scrolls
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSDone = () => {
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const day = String(tempDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    onChangeDate(formattedDate);
    setShow(false);
  };

  const handleIOSCancel = () => {
    setShow(false);
  };

  const handleOpen = () => {
    setTempDate(getDateValue());
    setShow(true);
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString || dateString.trim() === '') {
      return 'Select date';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Select date';
    }
    
    // Format as "Jan 15, 2024" or similar
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Web platform - use native HTML date input
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        
        <View style={[styles.inputContainer, error && styles.inputError]}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
          <TextInput
            ref={webInputRef}
            style={[styles.webInput, { outlineStyle: 'none' } as any]}
            value={value}
            onChange={(e: any) => {
              onChangeDate(e.target.value);
            }}
            placeholder="Select date"
            // @ts-ignore - type is web-specific
            type="date"
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Mobile platforms (iOS and Android)
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputError]}
        onPress={handleOpen}
      >
        <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {formatDisplayDate(value)}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android Date Picker */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={getDateValue()}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS Date Picker Modal */}
      {show && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={show}
          onRequestClose={handleIOSCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleIOSCancel} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={handleIOSDone} style={styles.modalButton}>
                  <Text style={[styles.modalButtonText, styles.modalButtonDone]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={onChange}
                  maximumDate={maximumDate}
                  minimumDate={minimumDate}
                  themeVariant="light"
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  webInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34, // Safe area padding for iOS
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalButtonDone: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  iosDatePicker: {
    height: 216,
  },
});
