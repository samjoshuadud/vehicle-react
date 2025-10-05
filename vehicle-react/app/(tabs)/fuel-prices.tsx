/**
 * Fuel Prices Screen
 * 
 * Community-sourced real-time fuel pricing based on user fuel logs.
 * Shows nearby gas stations with current fuel prices on an interactive map.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeArea } from '@/components/ui/SafeArea';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/services/api';

interface FuelStation {
  cluster_id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  avg_price_per_liter: number;
  min_price: number;
  max_price: number;
  report_count: number;
  last_updated: string;
  brand: string | null;
}

export default function FuelPricesScreen() {
  const { statusBarStyle, backgroundColor, currencySymbol } = useTheme();
  const { token } = useAuth();
  
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(true); // Toggle between map and list view
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    requestLocationAndFetch();
  }, [searchRadius, fuelTypeFilter]);

  // Refetch prices whenever the tab becomes focused (real-time updates)
  useFocusEffect(
    useCallback(() => {
      if (userLocation) {
        fetchFuelPrices(userLocation.latitude, userLocation.longitude);
      }
    }, [userLocation, searchRadius, fuelTypeFilter, token])
  );

  const requestLocationAndFetch = async () => {
    try {
      setIsLoading(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show nearby fuel prices.'
        );
        setIsLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);

      // Fetch fuel prices
      await fetchFuelPrices(coords.latitude, coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
      setIsLoading(false);
    }
  };

  const fetchFuelPrices = async (lat: number, lng: number) => {
    if (!token) return;

    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        radius_km: searchRadius.toString(),
        days_back: '7',
      });

      if (fuelTypeFilter) {
        params.append('fuel_type', fuelTypeFilter);
      }

      const response = await fetch(
        `${API_BASE_URL}/fuel-prices/nearby?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch fuel prices');
      }

      const data = await response.json();
      setStations(data.stations || []);
    } catch (error) {
      console.error('Error fetching fuel prices:', error);
      Alert.alert('Error', 'Failed to load fuel prices. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (userLocation) {
      fetchFuelPrices(userLocation.latitude, userLocation.longitude);
    }
  };

  const getMapHTML = () => {
    if (!userLocation) return '';

    const stationsJSON = JSON.stringify(stations);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; }
            #map { height: 100%; width: 100%; }
            
            /* Price marker styles */
            .price-marker-cheap {
              background-color: #10B981;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 18px;
            }
            
            .price-marker-average {
              background-color: #F59E0B;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 18px;
            }
            
            .price-marker-expensive {
              background-color: #EF4444;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 18px;
            }
            
            .user-marker {
              background-color: #3B82F6;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          
          <script>
            const stations = ${stationsJSON};
            const userLat = ${userLocation.latitude};
            const userLng = ${userLocation.longitude};
            
            // Initialize map
            const map = L.map('map', {
              zoomControl: true,
              attributionControl: false
            }).setView([userLat, userLng], 12);
            
            // Add tile layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              maxZoom: 19,
              subdomains: 'abcd'
            }).addTo(map);
            
            // Add user location marker
            const userIcon = L.divIcon({
              className: 'user-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            L.marker([userLat, userLng], { icon: userIcon })
              .bindPopup('<b>Your Location</b>')
              .addTo(map);
            
            // Calculate average price for color coding
            const prices = stations.map(s => s.avg_price_per_liter);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            // Add station markers
            stations.forEach(station => {
              let markerClass = 'price-marker-average';
              
              if (station.avg_price_per_liter <= minPrice + (maxPrice - minPrice) * 0.33) {
                markerClass = 'price-marker-cheap';
              } else if (station.avg_price_per_liter >= maxPrice - (maxPrice - minPrice) * 0.33) {
                markerClass = 'price-marker-expensive';
              }
              
              const icon = L.divIcon({
                className: markerClass,
                html: '₱',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });
              
              const marker = L.marker([station.latitude, station.longitude], { icon })
                .addTo(map);
              
              const lastUpdate = new Date(station.last_updated).toLocaleDateString();
              
              marker.bindPopup(\`
                <div style="min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #111827;">\${station.name}</h3>
                  <p style="margin: 4px 0; font-size: 18px; font-weight: bold; color: #059669;">
                    ₱\${station.avg_price_per_liter.toFixed(2)}/L
                  </p>
                  <p style="margin: 2px 0; font-size: 12px; color: #6B7280;">
                    📊 \${station.report_count} report\${station.report_count > 1 ? 's' : ''}
                  </p>
                  <p style="margin: 2px 0; font-size: 12px; color: #6B7280;">
                    📍 \${station.distance_km} km away
                  </p>
                  <p style="margin: 2px 0; font-size: 12px; color: #6B7280;">
                    🕐 Updated: \${lastUpdate}
                  </p>
                </div>
              \`);
            });
          </script>
        </body>
      </html>
    `;
  };

  const getPriceColor = (price: number, allPrices: number[]) => {
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    
    if (price <= min + (max - min) * 0.33) return '#10B981'; // Green - cheap
    if (price >= max - (max - min) * 0.33) return '#EF4444'; // Red - expensive
    return '#F59E0B'; // Orange - average
  };

  const allPrices = stations.map(s => s.avg_price_per_liter);

  if (isLoading && !isRefreshing) {
    return (
      <SafeArea style={styles.container} statusBarColor={backgroundColor}>
        <StatusBar style={statusBarStyle} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading fuel prices...</Text>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea style={styles.container} statusBarColor={backgroundColor}>
      <StatusBar style={statusBarStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⛽ Fuel Prices</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewToggle, showMap && styles.viewToggleActive]}
            onPress={() => setShowMap(!showMap)}
          >
            <Ionicons 
              name={showMap ? "map" : "list"} 
              size={20} 
              color={showMap ? "#FFFFFF" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, searchRadius === 5 && styles.filterChipActive]}
            onPress={() => setSearchRadius(5)}
          >
            <Text style={[styles.filterText, searchRadius === 5 && styles.filterTextActive]}>
              5 km
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, searchRadius === 10 && styles.filterChipActive]}
            onPress={() => setSearchRadius(10)}
          >
            <Text style={[styles.filterText, searchRadius === 10 && styles.filterTextActive]}>
              10 km
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, searchRadius === 20 && styles.filterChipActive]}
            onPress={() => setSearchRadius(20)}
          >
            <Text style={[styles.filterText, searchRadius === 20 && styles.filterTextActive]}>
              20 km
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, fuelTypeFilter === null && styles.filterChipActive]}
            onPress={() => setFuelTypeFilter(null)}
          >
            <Text style={[styles.filterText, fuelTypeFilter === null && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, fuelTypeFilter === 'Gasoline' && styles.filterChipActive]}
            onPress={() => setFuelTypeFilter('Gasoline')}
          >
            <Text style={[styles.filterText, fuelTypeFilter === 'Gasoline' && styles.filterTextActive]}>
              Gasoline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, fuelTypeFilter === 'Diesel' && styles.filterChipActive]}
            onPress={() => setFuelTypeFilter('Diesel')}
          >
            <Text style={[styles.filterText, fuelTypeFilter === 'Diesel' && styles.filterTextActive]}>
              Diesel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map or List View */}
      {showMap ? (
        <View style={styles.mapContainer}>
          {userLocation && stations.length > 0 && (
            <WebView
              ref={webViewRef}
              source={{ html: getMapHTML() }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          )}
          {stations.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No fuel price data nearby</Text>
              <Text style={styles.emptySubtext}>
                Be the first to contribute by logging your fuel purchases!
              </Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {stations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No fuel price data nearby</Text>
              <Text style={styles.emptySubtext}>
                Be the first to contribute by logging your fuel purchases!
              </Text>
            </View>
          ) : (
            stations.map((station) => (
              <View key={station.cluster_id} style={styles.stationCard}>
                <View style={styles.stationHeader}>
                  <View style={styles.stationInfo}>
                    <Text style={styles.stationName}>{station.name}</Text>
                    <Text style={styles.stationDistance}>
                      📍 {station.distance_km} km away
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priceIndicator,
                      { backgroundColor: getPriceColor(station.avg_price_per_liter, allPrices) },
                    ]}
                  >
                    <Text style={styles.priceText}>
                      {currencySymbol}{station.avg_price_per_liter.toFixed(2)}
                    </Text>
                    <Text style={styles.perLiter}>/L</Text>
                  </View>
                </View>
                <View style={styles.stationMeta}>
                  <Text style={styles.metaText}>
                    📊 {station.report_count} report{station.report_count > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.metaText}>
                    🕐 {new Date(station.last_updated).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.footerText}>
          Prices based on community fuel logs from the last 7 days
        </Text>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewToggleActive: {
    backgroundColor: '#3B82F6',
  },
  filters: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  stationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stationDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  perLiter: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  stationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
});
