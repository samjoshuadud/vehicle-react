import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StatusBar as RNStatusBar, View } from 'react-native';
import 'react-native-get-random-values'; // Must be imported before Firebase
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemeInitializer } from '@/components/ThemeInitializer';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { VehiclesProvider } from '@/context/VehiclesContext';
import { RemindersProvider } from '@/context/RemindersContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Auth-aware layout component
function AuthAwareLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, can access protected routes
        return;
      } else {
        // User is not authenticated, redirect to login
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <ThemedText style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
          Loading...
        </ThemedText>
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
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
        <Stack.Screen name="add-maintenance/[vehicleId]" />
        <Stack.Screen name="add-fuel/[vehicleId]" />
        <Stack.Screen name="add-reminder/[vehicleId]" />
        <Stack.Screen name="edit-vehicle/[id]" />
        <Stack.Screen name="edit-maintenance/[id]" />
        <Stack.Screen name="edit-fuel/[id]" />
        <Stack.Screen name="edit-reminder/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
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
      <AuthProvider>
        <ThemeInitializer>
          <VehiclesProvider>
            <RemindersProvider>
              <SafeAreaProvider>
                <AuthAwareLayout />
              </SafeAreaProvider>
            </RemindersProvider>
          </VehiclesProvider>
        </ThemeInitializer>
      </AuthProvider>
    </ThemeProvider>
  );
}
