import { FuelLog, MaintenanceLog } from '@/services/api';

export interface MonthlySpending {
  totalSpending: number;
  fuelSpending: number;
  maintenanceSpending: number;
  fuelCount: number;
  maintenanceCount: number;
  monthName: string;
  year: number;
}

export interface SpendingComparison {
  currentMonth: MonthlySpending;
  previousMonth: MonthlySpending;
  percentageChange: number;
}

/**
 * Calculate total spending for a given month
 */
export const calculateMonthlySpending = (
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
  month: number,
  year: number
): MonthlySpending => {
  // Filter fuel logs for the specified month
  const monthlyFuelLogs = fuelLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.getMonth() === month && logDate.getFullYear() === year;
  });

  // Filter maintenance logs for the specified month
  const monthlyMaintenanceLogs = maintenanceLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.getMonth() === month && logDate.getFullYear() === year;
  });

  // Calculate totals - convert to number to handle string values
  const fuelSpending = monthlyFuelLogs.reduce((sum, log) => {
    const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost;
    return sum + (cost || 0);
  }, 0);
  
  const maintenanceSpending = monthlyMaintenanceLogs.reduce((sum, log) => {
    const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost;
    return sum + (cost || 0);
  }, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    totalSpending: fuelSpending + maintenanceSpending,
    fuelSpending,
    maintenanceSpending,
    fuelCount: monthlyFuelLogs.length,
    maintenanceCount: monthlyMaintenanceLogs.length,
    monthName: monthNames[month],
    year,
  };
};

/**
 * Get spending comparison between current and previous month
 */
export const getSpendingComparison = (
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[]
): SpendingComparison => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate previous month (handle year boundary)
  let previousMonth = currentMonth - 1;
  let previousYear = currentYear;
  if (previousMonth < 0) {
    previousMonth = 11;
    previousYear -= 1;
  }

  const currentMonthSpending = calculateMonthlySpending(
    fuelLogs,
    maintenanceLogs,
    currentMonth,
    currentYear
  );

  const previousMonthSpending = calculateMonthlySpending(
    fuelLogs,
    maintenanceLogs,
    previousMonth,
    previousYear
  );

  // Calculate percentage change
  let percentageChange = 0;
  if (previousMonthSpending.totalSpending > 0) {
    percentageChange = 
      ((currentMonthSpending.totalSpending - previousMonthSpending.totalSpending) / 
      previousMonthSpending.totalSpending) * 100;
  } else if (currentMonthSpending.totalSpending > 0) {
    percentageChange = 100; // 100% increase from zero
  }

  return {
    currentMonth: currentMonthSpending,
    previousMonth: previousMonthSpending,
    percentageChange,
  };
};

/**
 * Format currency for display (Philippine Peso)
 */
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Get all vehicles' combined spending for current month
 */
export const getAllVehiclesMonthlySpending = (
  allFuelLogs: FuelLog[],
  allMaintenanceLogs: MaintenanceLog[]
): MonthlySpending => {
  const now = new Date();
  return calculateMonthlySpending(allFuelLogs, allMaintenanceLogs, now.getMonth(), now.getFullYear());
};
