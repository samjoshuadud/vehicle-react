import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const { token, isAuthenticated } = useAuth();

  const refreshReminders = async () => {
    if (!token || !isAuthenticated) return;

    setIsLoading(true);
    try {
      // Fetch all reminders, upcoming, and overdue in parallel
      const [allReminders, upcoming, overdue] = await Promise.all([
        apiService.getReminders(token),
        apiService.getUpcomingReminders(token, 7),
        apiService.getOverdueReminders(token)
      ]);

      setReminders(allReminders);
      setUpcomingReminders(upcoming);
      setOverdueReminders(overdue);
    } catch (error) {
      console.error('Failed to refresh reminders:', error);
      // Clear reminders on error to prevent stale data
      setReminders([]);
      setUpcomingReminders([]);
      setOverdueReminders([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      setReminders(prev => [...prev, newReminder]);
      
      // Refresh to update categorized lists
      await refreshReminders();
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
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.reminder_id === reminderId ? updatedReminder : reminder
        )
      );
      
      // Refresh to update categorized lists
      await refreshReminders();
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
  }, [isAuthenticated, token]);

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
