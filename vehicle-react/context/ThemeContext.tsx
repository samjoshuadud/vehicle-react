import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  statusBarStyle: 'light' | 'dark';
  backgroundColor: string;
  currency: string;
  currencySymbol: string;
  distanceUnit: 'km' | 'mi';
  volumeUnit: 'L' | 'gal';
  initializeDarkMode: (userDarkMode: boolean) => void;
  setMileageUnit: (useMiles: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the device color scheme
  const colorScheme = useColorScheme();
  
  // Initialize dark mode based on system preference, but allow user override
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [userPreferenceSet, setUserPreferenceSet] = useState(false);
  
  // Initialize unit preferences (default to metric)
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [volumeUnit, setVolumeUnit] = useState<'L' | 'gal'>('L');

  // Update dark mode if system preference changes (only if user hasn't set a preference)
  useEffect(() => {
    if (!userPreferenceSet) {
      setDarkMode(colorScheme === 'dark');
    }
  }, [colorScheme, userPreferenceSet]);

  // Initialize dark mode from user data
  const initializeDarkMode = (userDarkMode: boolean) => {
    setDarkMode(userDarkMode);
    setUserPreferenceSet(true);
  };

  // Set mileage unit based on user preference
  const setMileageUnit = (useMiles: boolean) => {
    setDistanceUnit(useMiles ? 'mi' : 'km');
    setVolumeUnit(useMiles ? 'gal' : 'L');
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    setUserPreferenceSet(true);
  };
  
  // Compute values based on current theme
  const statusBarStyle = darkMode ? 'light' : 'dark';
  const backgroundColor = darkMode ? '#1F2937' : '#F9FAFB';

  // Set the locale preferences for the Philippines
  const currency = 'PHP';
  const currencySymbol = '₱';

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        setDarkMode,
        statusBarStyle,
        backgroundColor,
        currency,
        currencySymbol,
        distanceUnit,
        volumeUnit,
        initializeDarkMode,
        setMileageUnit,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
