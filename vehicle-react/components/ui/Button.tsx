import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}) => {
  const getButtonStyle = () => {
    // Start with base style
    let buttonStyle = { ...styles.button };
    
    // Apply size styles
    if (size === 'small') {
      buttonStyle = { ...buttonStyle, ...styles.buttonSmall };
    } else if (size === 'large') {
      buttonStyle = { ...buttonStyle, ...styles.buttonLarge };
    }
    
    // Apply variant styles
    if (variant === 'primary') {
      buttonStyle = { ...buttonStyle, ...styles.buttonPrimary };
    } else if (variant === 'secondary') {
      buttonStyle = { ...buttonStyle, ...styles.buttonSecondary };
    } else if (variant === 'outline') {
      buttonStyle = { ...buttonStyle, ...styles.buttonOutline };
    } else if (variant === 'danger') {
      buttonStyle = { ...buttonStyle, ...styles.buttonDanger };
    }
    
    // Apply width style
    if (fullWidth) {
      buttonStyle = { ...buttonStyle, ...styles.buttonFullWidth };
    }
    
    // Apply disabled style
    if (disabled) {
      buttonStyle = { ...buttonStyle, ...styles.buttonDisabled };
    }
    
    return buttonStyle;
  };
  
  const getTextStyle = () => {
    // Start with base style
    let textStyle = { ...styles.text };
    
    // Apply size styles
    if (size === 'small') {
      textStyle = { ...textStyle, ...styles.textSmall };
    } else if (size === 'large') {
      textStyle = { ...textStyle, ...styles.textLarge };
    }
    
    // Apply variant styles
    if (variant === 'primary') {
      textStyle = { ...textStyle, ...styles.textPrimary };
    } else if (variant === 'secondary') {
      textStyle = { ...textStyle, ...styles.textSecondary };
    } else if (variant === 'outline') {
      textStyle = { ...textStyle, ...styles.textOutline };
    } else if (variant === 'danger') {
      textStyle = { ...textStyle, ...styles.textDanger };
    }
    
    // Apply disabled style
    if (disabled) {
      textStyle = { ...textStyle, ...styles.textDisabled };
    }
    
    return textStyle;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' ? '#3B82F6' : '#ffffff'} 
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={getTextStyle()}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonPrimary: {
    backgroundColor: '#3B82F6',
  },
  buttonSecondary: {
    backgroundColor: '#10B981',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  buttonDanger: {
    backgroundColor: '#EF4444',
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  textSmall: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 18,
  },
  textPrimary: {
    color: '#ffffff',
  },
  textSecondary: {
    color: '#ffffff',
  },
  textOutline: {
    color: '#3B82F6',
  },
  textDanger: {
    color: '#ffffff',
  },
  textDisabled: {
    color: '#9CA3AF',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});

export default Button;
