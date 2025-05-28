import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { apiService, Reminder } from '@/services/api';
import { useAuth } from './AuthContext';

interface RemindersContextType {
  reminders: Reminder[];
  upcomingReminders: Reminder[];
  overdueReminders: Reminder[];
  isLoading: boolean;
  refreshReminders: () => Promise<void>;
  getReminderById: (reminderId: number) => Promise<Reminder>;
  createReminder: (reminderData: Partial<Reminder>) => Promise<void>;
  updateReminder: (reminderId: number, reminderData: Partial<Reminder>) => Promise<void>;
  deleteReminder: (reminderId: number) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

export function useReminders() {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
}

interface RemindersProviderProps {
  children: ReactNode;
}

export function RemindersProvider({ children }: RemindersProviderProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Add flag to prevent concurrent refreshes
  const { token, isAuthenticated } = useAuth();

  const refreshReminders = useCallback(async () => {
    if (!token || !isAuthenticated) {
      console.log('RemindersContext: Skipping refresh - no token or not authenticated');
      return;
    }

    if (isRefreshing) {
      console.log('RemindersContext: Skipping refresh - already refreshing');
      return;
    }

    console.log('RemindersContext: Starting reminders refresh');
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      // Fetch all reminders, upcoming, and overdue in parallel
      const [allReminders, upcoming, overdue] = await Promise.all([
        apiService.getReminders(token),
        apiService.getUpcomingReminders(token, 7),
        apiService.getOverdueReminders(token)
      ]);

      console.log('RemindersContext: Successfully fetched reminders', {
        all: allReminders.length,
        upcoming: upcoming.length,
        overdue: overdue.length
      });

      setReminders(allReminders);
      setUpcomingReminders(upcoming);
      setOverdueReminders(overdue);
    } catch (error) {
      console.error('RemindersContext: Failed to refresh reminders:', error);
      // Clear reminders on error to prevent stale data
      setReminders([]);
      setUpcomingReminders([]);
      setOverdueReminders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      console.log('RemindersContext: Reminders refresh completed');
    }
  }, [token, isAuthenticated]);

  const getReminderById = async (reminderId: number): Promise<Reminder> => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      return await apiService.getReminderById(token, reminderId);
    } catch (error) {
      console.error('Failed to get reminder by ID:', error);
      throw error;
    }
  };

  const createReminder = async (reminderData: Partial<Reminder>) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const newReminder = await apiService.createReminder(token, reminderData);
      
      // Update state directly instead of calling refreshReminders to avoid infinite loops
      setReminders(prev => [...prev, newReminder]);
      
      // Also update categorized lists manually
      const now = new Date();
      const dueDate = new Date(newReminder.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        setOverdueReminders(prev => [...prev, newReminder]);
      } else if (diffDays <= 7) {
        setUpcomingReminders(prev => [...prev, newReminder]);
      }
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  };

  const updateReminder = async (reminderId: number, reminderData: Partial<Reminder>) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const updatedReminder = await apiService.updateReminder(token, reminderId, reminderData);
      
      // Update state directly instead of calling refreshReminders to avoid infinite loops
      setReminders(prev => 
        prev.map(reminder => 
          reminder.reminder_id === reminderId ? updatedReminder : reminder
        )
      );
      
      // Update categorized lists manually
      const now = new Date();
      const dueDate = new Date(updatedReminder.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Remove from all categorized lists first
      setUpcomingReminders(prev => prev.filter(r => r.reminder_id !== reminderId));
      setOverdueReminders(prev => prev.filter(r => r.reminder_id !== reminderId));
      
      // Add to appropriate categorized list
      if (diffDays < 0) {
        setOverdueReminders(prev => [...prev, updatedReminder]);
      } else if (diffDays <= 7) {
        setUpcomingReminders(prev => [...prev, updatedReminder]);
      }
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  };

  const deleteReminder = async (reminderId: number) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      await apiService.deleteReminder(token, reminderId);
      
      setReminders(prev => prev.filter(reminder => reminder.reminder_id !== reminderId));
      setUpcomingReminders(prev => prev.filter(reminder => reminder.reminder_id !== reminderId));
      setOverdueReminders(prev => prev.filter(reminder => reminder.reminder_id !== reminderId));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  };

  // Load reminders when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshReminders();
    } else {
      // Clear reminders when not authenticated
      setReminders([]);
      setUpcomingReminders([]);
      setOverdueReminders([]);
      setIsLoading(false); // Ensure loading is false when not authenticated
    }
  }, [isAuthenticated, token, refreshReminders]);

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        upcomingReminders,
        overdueReminders,
        isLoading,
        refreshReminders,
        getReminderById,
        createReminder,
        updateReminder,
        deleteReminder,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}
