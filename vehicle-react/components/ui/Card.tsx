import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { View } from '../../components/ThemedView';
import { Text } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  const cardStyles = [
    styles.card,
    variant === 'outlined' && styles.cardOutlined,
    variant === 'elevated' && styles.cardElevated,
    padding === 'none' && styles.paddingNone,
    padding === 'small' && styles.paddingSmall,
    padding === 'medium' && styles.paddingMedium,
    padding === 'large' && styles.paddingLarge,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

export const CardTitle: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <Text style={styles.cardTitle}>{children}</Text>
);

export const CardContent: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.cardContent}>{children}</View>
);

export const CardFooter: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.cardFooter}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 8,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  cardContent: {
    marginVertical: 8,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default Card;
