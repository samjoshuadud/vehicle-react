import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

/**
 * Component that initializes the theme based on user preferences
 * This bridges the AuthContext and ThemeContext to sync user's dark mode preference
 */
export const ThemeInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { initializeDarkMode } = useTheme();

  useEffect(() => {
    // Only initialize theme when auth loading is complete and we have user data
    if (!isLoading && user) {
      console.log('🎨 ThemeInitializer: Initializing dark mode from user preference:', user.dark_mode);
      initializeDarkMode(user.dark_mode);
    }
  }, [user, isLoading, initializeDarkMode]);

  return <>{children}</>;
};
