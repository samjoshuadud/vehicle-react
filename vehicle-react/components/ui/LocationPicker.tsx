import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  Platform, 
  TextInput, 
  ActivityIndicator,
  Alert,
  ScrollView 
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface LocationPickerProps {
  label: string;
  value: string;
  onChangeLocation: (location: string, coordinates?: { latitude: number; longitude: number }) => void;
  required?: boolean;
  error?: string;
  showGasStations?: boolean; // Show gas stations on the map
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({
  label,
  value,
  onChangeLocation,
  required = false,
  error,
  showGasStations = false,
}: LocationPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ latitude: 14.5995, longitude: 120.9842 }); // Default to Manila
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Get user's current location for search biasing
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setMapCenter({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Could not get initial location:', error);
      }
    })();
  }, []);

  // OpenStreetMap HTML with Leaflet (100% FREE - No API Key!)
  const getMapHTML = () => {
    const lat = selectedCoords?.latitude || mapCenter.latitude;
    const lng = selectedCoords?.longitude || mapCenter.longitude;
    
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
            
            /* Custom gas station marker */
            .gas-station-marker {
              background-color: #EF4444;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            /* Custom selected marker */
            .custom-marker {
              background-color: #3B82F6;
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            }
            
            .custom-marker::after {
              content: '';
              width: 8px;
              height: 8px;
              background: white;
              position: absolute;
              border-radius: 50%;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          
          <script>
            let map, marker, gasStationMarkers = [];
            const showGasStations = ${showGasStations};
            
            // Initialize OpenStreetMap with Leaflet
            map = L.map('map', {
              zoomControl: true,
              attributionControl: false
            }).setView([${lat}, ${lng}], 15);
            
            // Use CartoDB Voyager tiles for a clean appearance
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              attribution: '© OpenStreetMap, © CartoDB',
              maxZoom: 19,
              subdomains: 'abcd'
            }).addTo(map);
            
            // Create custom icon for main marker
            const customIcon = L.divIcon({
              className: 'custom-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 24]
            });
            
            // Add marker with custom icon
            marker = L.marker([${lat}, ${lng}], { 
              draggable: true,
              icon: customIcon
            }).addTo(map);
            
            // Load gas stations if enabled
            if (showGasStations) {
              loadGasStations(${lat}, ${lng});
            }
            
            // Handle map clicks
            map.on('click', function(e) {
              placeMarker(e.latlng);
            });
            
            // Handle marker drag
            marker.on('dragend', function(e) {
              const latlng = e.target.getLatLng();
              placeMarker(latlng);
              if (showGasStations) {
                loadGasStations(latlng.lat, latlng.lng);
              }
            });
            
            // Handle map move to load gas stations in new area
            if (showGasStations) {
              map.on('moveend', function() {
                const center = map.getCenter();
                loadGasStations(center.lat, center.lng);
              });
            }
            
            function placeMarker(latlng) {
              marker.setLatLng(latlng);
              map.panTo(latlng);
              
              // Send coordinates immediately
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location-selected',
                latitude: latlng.lat,
                longitude: latlng.lng,
                address: 'Loading location...'
              }));
              
              // Reverse geocode using Nominatim (FREE!)
              fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${latlng.lat}&lon=\${latlng.lng}&zoom=16\`)
                .then(response => response.json())
                .then(data => {
                  let address = '';
                  
                  if (data.address) {
                    const name = data.address.amenity || 
                                data.address.building || 
                                data.address.shop || 
                                data.name || '';
                    
                    const road = data.address.road || 
                                data.address.street || 
                                data.address.suburb || '';
                    
                    if (name && road) {
                      address = \`\${name}, \${road}\`;
                    } else if (road) {
                      const city = data.address.city || 
                                  data.address.municipality || 
                                  data.address.town || '';
                      address = city ? \`\${road}, \${city}\` : road;
                    } else if (name) {
                      address = name;
                    } else {
                      const parts = (data.display_name || '').split(',');
                      address = parts.slice(0, 2).join(',').trim();
                    }
                  }
                  
                  if (!address) {
                    address = \`Location (\${latlng.lat.toFixed(4)}, \${latlng.lng.toFixed(4)})\`;
                  }
                  
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location-selected',
                    latitude: latlng.lat,
                    longitude: latlng.lng,
                    address: address
                  }));
                })
                .catch(error => {
                  console.error('Reverse geocoding failed:', error);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location-selected',
                    latitude: latlng.lat,
                    longitude: latlng.lng,
                    address: \`Location (\${latlng.lat.toFixed(4)}, \${latlng.lng.toFixed(4)})\`
                  }));
                });
            }
            
            // Load nearby gas stations using Overpass API (FREE!)
            function loadGasStations(lat, lng) {
              gasStationMarkers.forEach(m => map.removeLayer(m));
              gasStationMarkers = [];
              
              const overpassQuery = \`
                [out:json][timeout:25];
                (
                  node["amenity"="fuel"](around:2000,\${lat},\${lng});
                  way["amenity"="fuel"](around:2000,\${lat},\${lng});
                );
                out center;
              \`;
              
              fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery
              })
              .then(response => response.json())
              .then(data => {
                const gasIcon = L.divIcon({
                  className: 'gas-station-marker',
                  iconSize: [10, 10],
                  iconAnchor: [5, 5]
                });
                
                data.elements.forEach(element => {
                  const elementLat = element.lat || element.center?.lat;
                  const elementLon = element.lon || element.center?.lon;
                  
                  if (elementLat && elementLon) {
                    const gasMarker = L.marker([elementLat, elementLon], { 
                      icon: gasIcon 
                    });
                    
                    const name = element.tags?.name || element.tags?.brand || 'Gas Station';
                    const street = element.tags?.['addr:street'] || '';
                    
                    let displayName = name;
                    if (street && !name.includes(street)) {
                      displayName = \`\${name}, \${street}\`;
                    }
                    
                    gasMarker.bindPopup(\`<b>\${name}</b>\`);
                    
                    gasMarker.on('click', function() {
                      marker.setLatLng([elementLat, elementLon]);
                      map.panTo([elementLat, elementLon]);
                      
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'location-selected',
                        latitude: elementLat,
                        longitude: elementLon,
                        address: displayName
                      }));
                    });
                    
                    gasMarker.addTo(map);
                    gasStationMarkers.push(gasMarker);
                  }
                });
              })
              .catch(error => console.error('Error loading gas stations:', error));
            }
            
            // Function to update map center (called from React Native)
            function updateMapCenter(lat, lng) {
              map.setView([lat, lng], 15);
              marker.setLatLng([lat, lng]);
              if (showGasStations) {
                loadGasStations(lat, lng);
              }
            }
          </script>
        </body>
      </html>
    `;
  };

  // Helper function to simplify location names
  const simplifyLocationName = (fullAddress: string): string => {
    // Don't process loading state or coordinates
    if (fullAddress.startsWith('Loading') || fullAddress.startsWith('Location (')) {
      return fullAddress;
    }
    
    // Extract meaningful parts from long address
    // Example: "Petron, Manuel L. Quezon Avenue, Lower Bicutan, Taguig..." 
    //       -> "Petron, Manuel L. Quezon Avenue"
    
    const parts = fullAddress.split(',').map(p => p.trim());
    
    // Known gas station brands
    const brands = ['Shell', 'Petron', 'Caltex', 'Phoenix', 'Seaoil', 'PTT', 'Total', 'Unioil', 'Flying V', 'Cleanfuel'];
    
    // Find if first part contains a brand
    const firstPart = parts[0] || '';
    const hasBrand = brands.some(brand => firstPart.toLowerCase().includes(brand.toLowerCase()));
    
    if (hasBrand && parts.length >= 2) {
      // Gas station format: "Brand, Street"
      return `${parts[0]}, ${parts[1]}`;
    } else if (parts.length >= 2) {
      // Generic location: "Street, City"
      return `${parts[0]}, ${parts[1]}`;
    } else {
      // Fallback to first part only
      return parts[0] || fullAddress;
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location-selected') {
        setSelectedCoords({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        
        // Simplify the address before passing it back
        const simplifiedAddress = simplifyLocationName(data.address);
        
        onChangeLocation(simplifiedAddress, {
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const searchLocation = async (query: string) => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchLat = userLocation?.latitude || mapCenter.latitude;
      const searchLng = userLocation?.longitude || mapCenter.longitude;
      
      // Use the query as-is - no automatic modifications
      let searchQuery = query;
      
      // Add Philippines to search query to restrict results to the country
      if (!searchQuery.toLowerCase().includes('philippines') && 
          !searchQuery.toLowerCase().includes('manila') &&
          !searchQuery.toLowerCase().includes('quezon') &&
          !searchQuery.toLowerCase().includes('cebu') &&
          !searchQuery.toLowerCase().includes('davao')) {
        searchQuery += ', Philippines';
      }
      
      // Use Nominatim API (OpenStreetMap - 100% FREE!)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `countrycodes=ph&` + // Restrict to Philippines
        `limit=15&` +
        `addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log('No results found for:', searchQuery);
        setSearchResults([]);
        return;
      }
      
      // Convert Nominatim results to our format
      const formattedResults = data.slice(0, 15).map((result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        const distance = calculateDistance(searchLat, searchLng, lat, lng);
        
        return {
          display_name: result.display_name,
          lat: result.lat,
          lon: result.lon,
          distance: distance,
          type: result.type === 'fuel' || result.class === 'amenity' ? 'fuel' : 'place',
        };
      });
      
      // Filter out results that are too far (more than 500km)
      const nearbyResults = formattedResults.filter((result: any) => result.distance < 500);
      
      // Sort by distance
      nearbyResults.sort((a: any, b: any) => a.distance - b.distance);
      setSearchResults(nearbyResults);
    } catch (error: any) {
      console.error('Error searching location:', error);
      console.log('❌ Search failed:', error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchButtonPress = () => {
    searchLocation(searchQuery);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSelectedCoords({ latitude: lat, longitude: lng });
    setMapCenter({ latitude: lat, longitude: lng });
    
    // Simplify the search result name
    const simplifiedName = simplifyLocationName(result.display_name);
    
    onChangeLocation(simplifiedName, { latitude: lat, longitude: lng });
    
    // Update map view via WebView
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`updateMapCenter(${lat}, ${lng}); true;`);
    }
    
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable location permissions to use this feature.'
        );
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setSelectedCoords({ latitude, longitude });
      setMapCenter({ latitude, longitude });
      
      // Reverse geocode
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const addressString = `${address.street || ''} ${address.city || ''}`.trim() || 
                           `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      // Simplify before saving
      const simplifiedAddress = simplifyLocationName(addressString);
      
      onChangeLocation(simplifiedAddress, { latitude, longitude });
      
      // Update map
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`updateMapCenter(${latitude}, ${longitude}); true;`);
      }
      
      Alert.alert('Success', 'Current location set successfully!');
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleDone = () => {
    if (!value) {
      Alert.alert('No Location Selected', 'Please select a location first.');
      return;
    }
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputError]}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.icon} />
        <Text style={[styles.locationText, !value && styles.placeholder]} numberOfLines={1}>
          {value || 'Select location'}
        </Text>
        <Ionicons name="map-outline" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Location</Text>
            <TouchableOpacity onPress={handleDone} style={styles.headerButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchButtonPress}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={handleSearchButtonPress} 
              style={styles.searchButton}
              disabled={isSearching || searchQuery.trim().length < 3}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Current Location Button */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.currentLocationButton} 
              onPress={handleUseCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="locate" size={20} color="#3B82F6" />
              )}
              <Text style={styles.currentLocationText}>
                {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <ScrollView style={styles.searchResults}>
              {searchResults.map((result: any, index) => {
                const isGasStation = result.type === 'fuel' || 
                                     result.class === 'amenity' || 
                                     result.display_name?.toLowerCase().includes('gas') ||
                                     result.display_name?.toLowerCase().includes('fuel') ||
                                     result.display_name?.toLowerCase().includes('petrol');
                const distance = result.distance ? `${result.distance.toFixed(1)} km` : '';
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(result)}
                  >
                    <Ionicons 
                      name={isGasStation ? "business" : "location"} 
                      size={20} 
                      color={isGasStation ? "#EF4444" : "#6B7280"} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {result.display_name}
                      </Text>
                      {distance && (
                        <Text style={styles.searchResultDistance}>{distance} away</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {isSearching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          )}

          {/* Map */}
          <WebView
            ref={webViewRef}
            source={{ html: getMapHTML() }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          />

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {showGasStations 
                ? 'Red dots are gas stations. Tap any location, drag the marker, or search'
                : 'Tap on the map, drag the marker, or search to select a location'}
            </Text>
          </View>

          {/* Selected Location Display */}
          {value && (
            <View style={styles.selectedLocationContainer}>
              <Ionicons name="location" size={20} color="#3B82F6" />
              <Text style={styles.selectedLocationText} numberOfLines={2}>
                {value}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'right',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  currentLocationText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  searchResults: {
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  searchResultText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  searchResultDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  searchingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
});
