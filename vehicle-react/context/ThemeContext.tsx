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
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the device color scheme
  const colorScheme = useColorScheme();
  
  // Initialize dark mode based on system preference
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');

  // Update dark mode if system preference changes
  useEffect(() => {
    setDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };
  // Compute values based on current theme
  const statusBarStyle = darkMode ? 'light' : 'dark';
  const backgroundColor = darkMode ? '#1F2937' : '#F9FAFB';

  // Set the locale preferences for the Philippines
  const currency = 'PHP';
  const currencySymbol = '₱';
  const distanceUnit = 'km' as const;
  const volumeUnit = 'L' as const;

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
