import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';

import { SafeArea } from '@/components/ui/SafeArea';
import { useTheme } from '@/context/ThemeContext';
import { useVehicles } from '@/context/VehiclesContext';
import { useAuth } from '@/context/AuthContext';
import { FuelLog, MaintenanceLog, apiService } from '@/services/api';
import { getSpendingComparison, formatCurrency, calculateMonthlySpending } from '@/utils/spending';

export default function InsightsScreen() {
  const { statusBarStyle, backgroundColor } = useTheme();
  const { vehicles } = useVehicles();
  const { token } = useAuth();
  
  const [allFuelLogs, setAllFuelLogs] = useState<FuelLog[]>([]);
  const [allMaintenanceLogs, setAllMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllLogs = async () => {
    if (!token || vehicles.length === 0) {
      setAllFuelLogs([]);
      setAllMaintenanceLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch logs for all vehicles
      const fuelLogsPromises = vehicles.map(v => apiService.getFuelLogs(token, v.vehicle_id));
      const maintenanceLogsPromises = vehicles.map(v => apiService.getMaintenanceLogs(token, v.vehicle_id));

      const fuelLogsArrays = await Promise.all(fuelLogsPromises);
      const maintenanceLogsArrays = await Promise.all(maintenanceLogsPromises);

      // Flatten arrays
      const allFuel = fuelLogsArrays.flat();
      const allMaintenance = maintenanceLogsArrays.flat();

      setAllFuelLogs(allFuel);
      setAllMaintenanceLogs(allMaintenance);
    } catch (error) {
      console.error('Failed to fetch logs for spending insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLogs();
  }, [vehicles, token]);

  const spendingData = getSpendingComparison(allFuelLogs, allMaintenanceLogs);

  // Get last 3 months data
  const now = new Date();
  const monthsData = [];
  for (let i = 0; i < 3; i++) {
    const month = now.getMonth() - i;
    const year = now.getFullYear();
    let adjustedMonth = month;
    let adjustedYear = year;
    
    if (month < 0) {
      adjustedMonth = 12 + month;
      adjustedYear = year - 1;
    }
    
    monthsData.push(calculateMonthlySpending(allFuelLogs, allMaintenanceLogs, adjustedMonth, adjustedYear));
  }

  if (vehicles.length === 0) {
    return (
      <SafeArea style={styles.container} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Insights Available</Text>
          <Text style={styles.emptySubtitle}>Add a vehicle to start tracking your spending</Text>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spending Insights</Text>
          <Text style={styles.subtitle}>Track your vehicle expenses</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAllLogs}
            colors={['#3B82F6']}
            tintColor='#3B82F6'
          />
        }
      >
        <View style={styles.content}>
          {/* Current Month Summary */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="calendar" size={20} color="#3B82F6" />
                <Text style={styles.cardTitle}>{spendingData.currentMonth.monthName} {spendingData.currentMonth.year}</Text>
              </View>
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Spending</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(spendingData.currentMonth.totalSpending)}
              </Text>
              
              {spendingData.previousMonth.totalSpending > 0 && (
                <View style={[
                  styles.changeBadge,
                  spendingData.percentageChange >= 0 ? styles.changeBadgeUp : styles.changeBadgeDown
                ]}>
                  <Ionicons 
                    name={spendingData.percentageChange >= 0 ? "trending-up" : "trending-down"} 
                    size={16} 
                    color={spendingData.percentageChange >= 0 ? "#DC2626" : "#059669"} 
                  />
                  <Text style={[
                    styles.changeText,
                    spendingData.percentageChange >= 0 ? styles.changeTextUp : styles.changeTextDown
                  ]}>
                    {Math.abs(spendingData.percentageChange).toFixed(1)}% vs last month
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Breakdown Grid */}
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownCard}>
                <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="water" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.breakdownLabel}>Fuel</Text>
                <Text style={styles.breakdownAmount}>
                  {formatCurrency(spendingData.currentMonth.fuelSpending)}
                </Text>
                <Text style={styles.breakdownCount}>
                  {spendingData.currentMonth.fuelCount} fill-ups
                </Text>
              </View>

              <View style={styles.breakdownCard}>
                <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="build" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.breakdownLabel}>Maintenance</Text>
                <Text style={styles.breakdownAmount}>
                  {formatCurrency(spendingData.currentMonth.maintenanceSpending)}
                </Text>
                <Text style={styles.breakdownCount}>
                  {spendingData.currentMonth.maintenanceCount} services
                </Text>
              </View>
            </View>
          </View>

          {/* Monthly History */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="bar-chart" size={20} color="#3B82F6" />
                <Text style={styles.cardTitle}>Last 3 Months</Text>
              </View>
            </View>

            <View style={styles.historyList}>
              {monthsData.map((monthData, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyMonth}>{monthData.monthName}</Text>
                    <Text style={styles.historyYear}>{monthData.year}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      {formatCurrency(monthData.totalSpending)}
                    </Text>
                    <Text style={styles.historyDetails}>
                      {monthData.fuelCount + monthData.maintenanceCount} transactions
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="stats-chart" size={20} color="#3B82F6" />
                <Text style={styles.cardTitle}>Quick Stats</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{vehicles.length}</Text>
                <Text style={styles.statLabel}>Vehicles</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{allFuelLogs.length}</Text>
                <Text style={styles.statLabel}>Fuel Logs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{allMaintenanceLogs.length}</Text>
                <Text style={styles.statLabel}>Services</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  changeBadgeUp: {
    backgroundColor: '#FEE2E2',
  },
  changeBadgeDown: {
    backgroundColor: '#D1FAE5',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeTextUp: {
    color: '#DC2626',
  },
  changeTextDown: {
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  breakdownAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  breakdownCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  historyLeft: {
    flex: 1,
  },
  historyMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  historyYear: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  historyDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
