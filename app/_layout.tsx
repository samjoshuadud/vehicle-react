import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Configure status bar for Android to prevent overlap
    if (Platform.OS === 'android') {
      // Make status bar transparent
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    }
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack 
          initialRouteName="login"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F9FAFB' }
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="vehicle/[id]" />
          <Stack.Screen name="add-vehicle" />
          <Stack.Screen name="add-maintenance/[id]" />
          <Stack.Screen name="add-fuel/[id]" />
          <Stack.Screen name="add-reminder/[id]" />
          <Stack.Screen name="edit-vehicle/[id]" />
          <Stack.Screen name="edit-maintenance/[id]" />
          <Stack.Screen name="edit-fuel/[id]" />
          <Stack.Screen name="edit-reminder/[id]" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </NavigationThemeProvider>
    </SafeAreaProvider>
    </ThemeProvider>
  );
}
