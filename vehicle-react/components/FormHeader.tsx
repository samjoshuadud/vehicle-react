import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface FormHeaderProps {
  title: string;
  onBack?: () => void;
  hasUnsavedChanges?: boolean;
}

export default function FormHeader({ 
  title, 
  onBack, 
  hasUnsavedChanges = false
}: FormHeaderProps) {
  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => onBack ? onBack() : router.back()
          }
        ]
      );
    } else {
      onBack ? onBack() : router.back();
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <View style={styles.headerRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
});
