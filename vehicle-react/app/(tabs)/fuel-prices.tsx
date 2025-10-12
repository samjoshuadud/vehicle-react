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

interface FuelPrice {
  fuel_type: string;
  avg_price_per_liter: number;
  min_price: number;
  max_price: number;
  report_count: number;
}

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
  fuel_type?: string | null;
  fuel_prices?: FuelPrice[];  // Array of prices by fuel type
}

export default function FuelPricesScreen() {
  const { statusBarStyle, backgroundColor, currencySymbol, distanceUnit } = useTheme();
  const { token } = useAuth();
  
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(true); // Toggle between map and list view
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null); // Brand filter (Shell, Petron, etc.)
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set()); // Track expanded cards
  const [expandedFilter, setExpandedFilter] = useState<'radius' | 'fuel' | 'brand' | null>(null); // Track which filter is expanded
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    requestLocationAndFetch();
  }, [searchRadius, fuelTypeFilter, brandFilter]);

  // Refetch prices whenever the tab becomes focused (real-time updates)
  useFocusEffect(
    useCallback(() => {
      if (userLocation) {
        fetchFuelPrices(userLocation.latitude, userLocation.longitude);
      }
    }, [userLocation, searchRadius, fuelTypeFilter, brandFilter, token])
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
      let filteredStations = data.stations || [];
      
      // Client-side brand filtering
      if (brandFilter) {
        filteredStations = filteredStations.filter((station: FuelStation) => {
          const stationName = station.name.toLowerCase();
          const brand = brandFilter.toLowerCase();
          
          // Handle "Others" - stations that don't match any major brand
          if (brand === 'others') {
            const majorBrands = ['shell', 'petron', 'caltex', 'phoenix', 'seaoil', 'unioil', 'cleanfuel', 'total'];
            return !majorBrands.some(majorBrand => stationName.includes(majorBrand));
          }
          
          return stationName.includes(brand);
        });
      }
      
      setStations(filteredStations);
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

  // Convert km to miles
  const kmToMiles = (km: number) => km * 0.621371;
  const milesToKm = (miles: number) => miles / 0.621371;

  // Format distance based on user preference
  const formatDistance = (km: number) => {
    if (distanceUnit === 'mi') {
      return `${kmToMiles(km).toFixed(1)} mi`;
    }
    return `${km} km`;
  };

  // Get radius options based on unit
  const getRadiusOptions = () => {
    if (distanceUnit === 'mi') {
      return [
        { value: milesToKm(3), label: '3 mi' },
        { value: milesToKm(6), label: '6 mi' },
        { value: milesToKm(12), label: '12 mi' },
      ];
    }
    return [
      { value: 5, label: '5 km' },
      { value: 10, label: '10 km' },
      { value: 20, label: '20 km' },
    ];
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
            
            // Add station markers - one per location
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
              
              // Helper function to format fuel type
              function formatFuelType(fuelType) {
                if (fuelType === 'Gasoline (Unleaded)') return '⛽ Unleaded';
                if (fuelType === 'Gasoline (Premium)') return '⭐ Premium';
                if (fuelType === 'Diesel') return '🚛 Diesel';
                if (fuelType === 'Electric') return '⚡ Electric';
                if (fuelType === 'Hybrid') return '🔋 Hybrid';
                return fuelType;
              }
              
              // Build fuel prices section
              let fuelPricesHTML = '';
              if (station.fuel_prices && station.fuel_prices.length > 0) {
                fuelPricesHTML = '<div style="margin-top: 12px; border-top: 1px solid #E5E7EB; padding-top: 8px;">';
                fuelPricesHTML += '<p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Available Prices</p>';
                
                station.fuel_prices.forEach(fp => {
                  const fuelIcon = formatFuelType(fp.fuel_type);
                  fuelPricesHTML += \`
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0; padding: 6px 8px; background: #F9FAFB; border-radius: 6px;">
                      <span style="font-size: 12px; color: #4B5563; font-weight: 500;">\${fuelIcon}</span>
                      <span style="font-size: 14px; color: #059669; font-weight: bold;">₱\${fp.avg_price_per_liter.toFixed(2)}/L</span>
                    </div>
                  \`;
                });
                
                fuelPricesHTML += '</div>';
              }
              
              marker.bindPopup(\`
                <div style="min-width: 220px;">
                  <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 15px;">\${station.name}</h3>
                  <p style="margin: 4px 0; font-size: 16px; font-weight: bold; color: #059669;">
                    Avg: ₱\${station.avg_price_per_liter.toFixed(2)}/L
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
                  \${fuelPricesHTML}
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
      <View style={styles.filtersContainer}>
        <View style={styles.filterButtonsRow}>
          {/* Radius Filter Button */}
          <TouchableOpacity
            style={[styles.filterButton, expandedFilter === 'radius' && styles.filterButtonActive]}
            onPress={() => setExpandedFilter(expandedFilter === 'radius' ? null : 'radius')}
          >
            <Ionicons name="navigate-circle" size={16} color={expandedFilter === 'radius' ? "#FFFFFF" : "#3B82F6"} />
            <Text style={[styles.filterButtonText, expandedFilter === 'radius' && styles.filterButtonTextActive]}>
              Radius
            </Text>
            <Ionicons 
              name={expandedFilter === 'radius' ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={expandedFilter === 'radius' ? "#FFFFFF" : "#6B7280"} 
            />
          </TouchableOpacity>

          {/* Fuel Type Filter Button */}
          <TouchableOpacity
            style={[styles.filterButton, expandedFilter === 'fuel' && styles.filterButtonActive]}
            onPress={() => setExpandedFilter(expandedFilter === 'fuel' ? null : 'fuel')}
          >
            <Ionicons name="water" size={16} color={expandedFilter === 'fuel' ? "#FFFFFF" : "#3B82F6"} />
            <Text style={[styles.filterButtonText, expandedFilter === 'fuel' && styles.filterButtonTextActive]}>
              Fuel Type
            </Text>
            <Ionicons 
              name={expandedFilter === 'fuel' ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={expandedFilter === 'fuel' ? "#FFFFFF" : "#6B7280"} 
            />
          </TouchableOpacity>

          {/* Brand Filter Button */}
          <TouchableOpacity
            style={[styles.filterButton, expandedFilter === 'brand' && styles.filterButtonActive]}
            onPress={() => setExpandedFilter(expandedFilter === 'brand' ? null : 'brand')}
          >
            <Ionicons name="business" size={16} color={expandedFilter === 'brand' ? "#FFFFFF" : "#3B82F6"} />
            <Text style={[styles.filterButtonText, expandedFilter === 'brand' && styles.filterButtonTextActive]}>
              Brand
            </Text>
            <Ionicons 
              name={expandedFilter === 'brand' ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={expandedFilter === 'brand' ? "#FFFFFF" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>

        {/* Expanded Filter Options */}
        {expandedFilter === 'radius' && (
          <View style={styles.filterOptionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
              {getRadiusOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.filterChip, searchRadius === option.value && styles.filterChipActive]}
                  onPress={() => {
                    setSearchRadius(option.value);
                    setExpandedFilter(null);
                  }}
                >
                  <Text style={[styles.filterText, searchRadius === option.value && styles.filterTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {expandedFilter === 'fuel' && (
          <View style={styles.filterOptionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterChip, fuelTypeFilter === null && styles.filterChipActive]}
                onPress={() => {
                  setFuelTypeFilter(null);
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, fuelTypeFilter === null && styles.filterTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, fuelTypeFilter === 'Gasoline (Unleaded)' && styles.filterChipActive]}
                onPress={() => {
                  setFuelTypeFilter('Gasoline (Unleaded)');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, fuelTypeFilter === 'Gasoline (Unleaded)' && styles.filterTextActive]}>
                  ⛽ Unleaded
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, fuelTypeFilter === 'Gasoline (Premium)' && styles.filterChipActive]}
                onPress={() => {
                  setFuelTypeFilter('Gasoline (Premium)');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, fuelTypeFilter === 'Gasoline (Premium)' && styles.filterTextActive]}>
                  ⭐ Premium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, fuelTypeFilter === 'Diesel' && styles.filterChipActive]}
                onPress={() => {
                  setFuelTypeFilter('Diesel');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, fuelTypeFilter === 'Diesel' && styles.filterTextActive]}>
                  🚛 Diesel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, fuelTypeFilter === 'Electric' && styles.filterChipActive]}
                onPress={() => {
                  setFuelTypeFilter('Electric');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, fuelTypeFilter === 'Electric' && styles.filterTextActive]}>
                  ⚡ Electric
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {expandedFilter === 'brand' && (
          <View style={styles.filterOptionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === null && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter(null);
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === null && styles.filterTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Shell' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Shell');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Shell' && styles.filterTextActive]}>
                  🐚 Shell
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Petron' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Petron');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Petron' && styles.filterTextActive]}>
                  ⭐ Petron
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Caltex' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Caltex');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Caltex' && styles.filterTextActive]}>
                  🔺 Caltex
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Phoenix' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Phoenix');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Phoenix' && styles.filterTextActive]}>
                  🔥 Phoenix
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Seaoil' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Seaoil');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Seaoil' && styles.filterTextActive]}>
                  🌊 Seaoil
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Cleanfuel' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Cleanfuel');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Cleanfuel' && styles.filterTextActive]}>
                  ♻️ Cleanfuel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Total' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Total');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Total' && styles.filterTextActive]}>
                  ⚫ Total
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, brandFilter === 'Others' && styles.filterChipActive]}
                onPress={() => {
                  setBrandFilter('Others');
                  setExpandedFilter(null);
                }}
              >
                <Text style={[styles.filterText, brandFilter === 'Others' && styles.filterTextActive]}>
                  📍 Others
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
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
            stations.map((station) => {
              const isExpanded = expandedStations.has(station.cluster_id);
              const hasMultipleFuelTypes = station.fuel_prices && station.fuel_prices.length > 1;
              const hasSingleFuelType = station.fuel_prices && station.fuel_prices.length === 1;
              
              const formatFuelType = (ft: string) => {
                if (ft === 'Gasoline (Unleaded)') return '⛽ Unleaded';
                if (ft === 'Gasoline (Premium)') return '⭐ Premium';
                if (ft === 'Diesel') return '🚛 Diesel';
                if (ft === 'Electric') return '⚡ Electric';
                if (ft === 'Hybrid') return '🔋 Hybrid';
                return ft;
              };
              
              return (
                <TouchableOpacity
                  key={station.cluster_id}
                  style={styles.stationCard}
                  onPress={() => {
                    if (hasMultipleFuelTypes) {
                      const newExpanded = new Set(expandedStations);
                      if (isExpanded) {
                        newExpanded.delete(station.cluster_id);
                      } else {
                        newExpanded.add(station.cluster_id);
                      }
                      setExpandedStations(newExpanded);
                    }
                  }}
                  activeOpacity={hasMultipleFuelTypes ? 0.7 : 1}
                >
                  <View style={styles.stationHeader}>
                    <View style={styles.stationInfo}>
                      <View style={styles.stationNameRow}>
                        <Text style={styles.stationName}>{station.name}</Text>
                        {hasMultipleFuelTypes && (
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#6B7280" 
                          />
                        )}
                        {hasSingleFuelType && station.fuel_prices && (
                          <View style={styles.fuelTypeBadge}>
                            <Text style={styles.fuelTypeBadgeText}>
                              {formatFuelType(station.fuel_prices[0].fuel_type)}
                            </Text>
                          </View>
                        )}
                      </View>
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
                  
                  {/* Expandable fuel prices section */}
                  {isExpanded && station.fuel_prices && station.fuel_prices.length > 0 && (
                    <View style={styles.fuelPricesContainer}>
                      <View style={styles.fuelPricesDivider} />
                      <Text style={styles.fuelPricesTitle}>Available Prices</Text>
                      {station.fuel_prices.map((fuelPrice, index) => {
                        const formatFuelType = (ft: string) => {
                          if (ft === 'Gasoline (Unleaded)') return '⛽ Unleaded';
                          if (ft === 'Gasoline (Premium)') return '⭐ Premium';
                          if (ft === 'Diesel') return '🚛 Diesel';
                          if (ft === 'Electric') return '⚡ Electric';
                          if (ft === 'Hybrid') return '🔋 Hybrid';
                          return ft;
                        };
                        
                        return (
                          <View key={index} style={styles.fuelPriceRow}>
                            <Text style={styles.fuelPriceType}>{formatFuelType(fuelPrice.fuel_type)}</Text>
                            <Text style={styles.fuelPriceValue}>
                              {currencySymbol}{fuelPrice.avg_price_per_liter.toFixed(2)}/L
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterOptionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
  },
  filterOptions: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  stationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  fuelTypeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  fuelTypeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1E40AF',
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
  fuelPricesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  fuelPricesDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  fuelPricesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fuelPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  fuelPriceType: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  fuelPriceValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#059669',
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
