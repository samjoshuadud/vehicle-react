import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, View, Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

interface SafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
  statusBarColor?: string;
}

export function SafeArea({ children, style, statusBarColor }: SafeAreaProps) {
  const insets = useSafeAreaInsets();
  const { backgroundColor } = useTheme();
  
  // Use provided statusBarColor or fall back to theme backgroundColor
  const barColor = statusBarColor || backgroundColor;
  
  return (
    <View style={[styles.container, { backgroundColor: barColor }, style]}>
      {Platform.OS === 'android' && (
        <View 
          style={[
            styles.statusBar, 
            { 
              height: StatusBar.currentHeight || insets.top || 24,
              backgroundColor: barColor 
            }
          ]} 
        />
      )}
      <SafeAreaView style={styles.content}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    width: '100%',
  },
  content: {
    flex: 1,
  },
});
