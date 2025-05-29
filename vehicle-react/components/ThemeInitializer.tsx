import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

/**
 * Component that initializes the theme based on user preferences
 * This bridges the AuthContext and ThemeContext to sync user's dark mode preference and mileage unit
 */
export const ThemeInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { initializeDarkMode, setMileageUnit } = useTheme();

  useEffect(() => {
    // Only initialize theme when auth loading is complete and we have user data
    if (!isLoading && user) {
      console.log('🎨 ThemeInitializer: Initializing dark mode from user preference:', user.dark_mode);
      console.log('📏 ThemeInitializer: Initializing mileage unit from user preference:', user.mileage_type);
      initializeDarkMode(user.dark_mode);
      setMileageUnit(user.mileage_type === 'miles');
    }
  }, [user, isLoading, initializeDarkMode, setMileageUnit]);

  return <>{children}</>;
};
