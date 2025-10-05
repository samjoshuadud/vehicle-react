import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, ScrollView, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
  allowCustom?: boolean; // Allow "Other" option that lets user type custom value
}

export default function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  required = false,
  error,
  leftIcon,
  allowCustom = false,
}: SelectProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Check if current value is a custom value (not in predefined options)
  const isCustomValue = value && !options.some(opt => opt.value === value);
  
  const getDisplayValue = (): string => {
    if (!value) return placeholder;
    
    // Check if it's a predefined option
    const option = options.find(opt => opt.value === value);
    if (option) return option.label;
    
    // If not found and allowCustom, display the custom value
    if (allowCustom && isCustomValue) {
      return value;
    }
    
    return placeholder;
  };

  const handleOptionSelect = (optionValue: string) => {
    if (optionValue === 'custom' && allowCustom) {
      setShowCustomInput(true);
      setCustomValue(isCustomValue ? value : '');
    } else {
      onValueChange(optionValue);
      setIsModalVisible(false);
      setShowCustomInput(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onValueChange(customValue.trim());
      setIsModalVisible(false);
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[styles.selectContainer, error && styles.selectError]}
        onPress={() => setIsModalVisible(true)}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <Text style={[styles.selectText, !value && styles.placeholder]}>
          {getDisplayValue()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsModalVisible(false);
          setShowCustomInput(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setIsModalVisible(false);
                    setShowCustomInput(false);
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {!showCustomInput ? (
                <ScrollView style={styles.optionsContainer}>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionItem,
                        value === option.value && styles.optionItemSelected,
                      ]}
                      onPress={() => handleOptionSelect(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          value === option.value && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {value === option.value && (
                        <Ionicons name="checkmark" size={24} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                  
                  {allowCustom && (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isCustomValue && styles.optionItemSelected,
                      ]}
                      onPress={() => handleOptionSelect('custom')}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isCustomValue && styles.optionTextSelected,
                        ]}
                      >
                        {isCustomValue ? `Custom: ${value}` : 'Other (Custom)'}
                      </Text>
                      {isCustomValue && (
                        <Ionicons name="checkmark" size={24} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              ) : (
                <View style={styles.customInputContainer}>
                  <Text style={styles.customInputLabel}>Enter custom value:</Text>
                  <TextInput
                    value={customValue}
                    onChangeText={setCustomValue}
                    placeholder="Type here..."
                    style={styles.customInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleCustomSubmit}
                  />
                  <View style={styles.customInputButtons}>
                    <TouchableOpacity
                      style={[styles.customButton, styles.customButtonCancel]}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomValue('');
                      }}
                    >
                      <Text style={styles.customButtonTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.customButton, styles.customButtonSubmit]}
                      onPress={handleCustomSubmit}
                    >
                      <Text style={styles.customButtonTextSubmit}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  selectContainer: {
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
  selectError: {
    borderColor: '#EF4444',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
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
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  customInputContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  customInputWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  customInput: {
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  customInputButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  customButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  customButtonSubmit: {
    backgroundColor: '#3B82F6',
  },
  customButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  customButtonTextSubmit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
