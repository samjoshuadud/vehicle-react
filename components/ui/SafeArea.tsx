import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, View, Platform, ViewStyle } from 'react-native';

interface SafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SafeArea({ children, style }: SafeAreaProps) {
  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'android' && <View style={[styles.statusBar, { height: StatusBar.currentHeight }]} />}
      <SafeAreaView style={styles.content}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statusBar: {
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
});
