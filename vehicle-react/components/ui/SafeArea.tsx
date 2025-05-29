import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, View, Platform, ViewStyle, Text } from 'react-native';
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
  
  // Function to recursively wrap string children in Text components
  const renderChildren = (node: React.ReactNode): React.ReactNode => {
    // If node is a string, wrap it in a Text component
    if (typeof node === 'string') {
      return <Text>{node}</Text>;
    }
    
    // If node is a number, wrap it in a Text component
    if (typeof node === 'number') {
      return <Text>{node}</Text>;
    }
    
    // If node is null, undefined, or boolean, return as is
    if (node == null || typeof node === 'boolean') {
      return node;
    }
    
    // If node is an array, recursively process each element
    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>
          {renderChildren(child)}
        </React.Fragment>
      ));
    }
    
    // If node is a React element, clone it and recursively process its children
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      
      // If the element has children, recursively process them
      if (element.props && element.props.children) {
        return React.cloneElement(element, {
          ...element.props,
          children: renderChildren(element.props.children)
        });
      }
    }
    
    // Otherwise, return the node as is
    return node;
  };
  
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
        {renderChildren(children)}
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
