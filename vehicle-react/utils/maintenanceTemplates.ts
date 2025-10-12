import { MaintenanceLog } from '@/services/api';

export interface MaintenanceTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  defaultInterval: 'monthly' | 'yearly';
  intervalMonths: number; // How many months between services
  category: 'routine' | 'periodic' | 'seasonal';
}

export const MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  // Routine Maintenance (Every few months)
  {
    id: 'oil_change',
    title: 'Oil Change',
    description: 'Change engine oil and oil filter',
    icon: 'water',
    defaultInterval: 'monthly',
    intervalMonths: 3,
    category: 'routine',
  },
  {
    id: 'tire_rotation',
    title: 'Tire Rotation',
    description: 'Rotate tires for even wear',
    icon: 'sync',
    defaultInterval: 'monthly',
    intervalMonths: 6,
    category: 'routine',
  },
  {
    id: 'air_filter',
    title: 'Air Filter Replacement',
    description: 'Replace engine air filter',
    icon: 'filter',
    defaultInterval: 'monthly',
    intervalMonths: 6,
    category: 'routine',
  },
  {
    id: 'cabin_filter',
    title: 'Cabin Air Filter',
    description: 'Replace cabin air filter for better air quality',
    icon: 'leaf',
    defaultInterval: 'monthly',
    intervalMonths: 6,
    category: 'routine',
  },
  
  // Periodic Maintenance (Yearly)
  {
    id: 'brake_inspection',
    title: 'Brake Inspection',
    description: 'Inspect brake pads, rotors, and fluid',
    icon: 'hand-left',
    defaultInterval: 'yearly',
    intervalMonths: 12,
    category: 'periodic',
  },
  {
    id: 'battery_check',
    title: 'Battery Check',
    description: 'Test battery and clean terminals',
    icon: 'battery-charging',
    defaultInterval: 'yearly',
    intervalMonths: 12,
    category: 'periodic',
  },
  {
    id: 'coolant_flush',
    title: 'Coolant Flush',
    description: 'Flush and replace engine coolant',
    icon: 'thermometer',
    defaultInterval: 'yearly',
    intervalMonths: 24,
    category: 'periodic',
  },
  {
    id: 'transmission_service',
    title: 'Transmission Service',
    description: 'Change transmission fluid and filter',
    icon: 'cog',
    defaultInterval: 'yearly',
    intervalMonths: 24,
    category: 'periodic',
  },
  {
    id: 'spark_plugs',
    title: 'Spark Plugs Replacement',
    description: 'Replace spark plugs for optimal performance',
    icon: 'flash',
    defaultInterval: 'yearly',
    intervalMonths: 24,
    category: 'periodic',
  },
  {
    id: 'wheel_alignment',
    title: 'Wheel Alignment',
    description: 'Check and adjust wheel alignment',
    icon: 'compass',
    defaultInterval: 'yearly',
    intervalMonths: 12,
    category: 'periodic',
  },
  
  // Seasonal/Annual
  {
    id: 'annual_inspection',
    title: 'Annual Vehicle Inspection',
    description: 'Comprehensive vehicle safety inspection',
    icon: 'checkmark-circle',
    defaultInterval: 'yearly',
    intervalMonths: 12,
    category: 'seasonal',
  },
  {
    id: 'rainy_season_prep',
    title: 'Rainy Season Preparation',
    description: 'Check wipers, lights, and tire tread for rainy season',
    icon: 'rainy',
    defaultInterval: 'yearly',
    intervalMonths: 12,
    category: 'seasonal',
  },
];

/**
 * Calculate next due date based on last maintenance
 */
export const calculateNextDueDate = (
  lastMaintenanceDate: string,
  intervalMonths: number
): string => {
  const lastDate = new Date(lastMaintenanceDate);
  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + intervalMonths);
  
  return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

/**
 * Get suggested reminder date based on last maintenance log
 */
export const getSuggestedReminderFromLogs = (
  maintenanceLogs: MaintenanceLog[],
  maintenanceType: string,
  intervalMonths: number
): string | null => {
  // Find the most recent log of this type
  const relevantLogs = maintenanceLogs
    .filter(log => log.maintenance_type.toLowerCase().includes(maintenanceType.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (relevantLogs.length === 0) {
    return null;
  }
  
  const lastLog = relevantLogs[0];
  return calculateNextDueDate(lastLog.date, intervalMonths);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: 'routine' | 'periodic' | 'seasonal') => {
  return MAINTENANCE_TEMPLATES.filter(t => t.category === category);
};

/**
 * Format interval for display
 */
export const formatInterval = (intervalMonths: number): string => {
  if (intervalMonths === 1) return 'Every month';
  if (intervalMonths === 3) return 'Every 3 months';
  if (intervalMonths === 6) return 'Every 6 months';
  if (intervalMonths === 12) return 'Every year';
  if (intervalMonths === 24) return 'Every 2 years';
  return `Every ${intervalMonths} months`;
};
