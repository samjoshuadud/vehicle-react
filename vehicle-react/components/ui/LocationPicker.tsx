import React, { useState, useRef } from 'react';
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
}: LocationPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ latitude: 14.5995, longitude: 120.9842 }); // Default to Manila
  const webViewRef = useRef<WebView>(null);

  // OpenStreetMap HTML with Leaflet
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
          </style>
        </head>
        <body>
          <div id="map"></div>
          
          <script>
            let map, marker;
            
            // Initialize map
            map = L.map('map').setView([${lat}, ${lng}], 15);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);
            
            // Add marker
            marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
            
            // Handle map clicks
            map.on('click', function(e) {
              placeMarker(e.latlng);
            });
            
            // Handle marker drag
            marker.on('dragend', function(e) {
              placeMarker(e.target.getLatLng());
            });
            
            function placeMarker(latlng) {
              marker.setLatLng(latlng);
              map.panTo(latlng);
              
              // Reverse geocode using Nominatim
              fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${latlng.lat}&lon=\${latlng.lng}\`)
                .then(response => response.json())
                .then(data => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location-selected',
                    latitude: latlng.lat,
                    longitude: latlng.lng,
                    address: data.display_name || \`\${latlng.lat.toFixed(6)}, \${latlng.lng.toFixed(6)}\`
                  }));
                })
                .catch(error => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location-selected',
                    latitude: latlng.lat,
                    longitude: latlng.lng,
                    address: \`\${latlng.lat.toFixed(6)}, \${latlng.lng.toFixed(6)}\`
                  }));
                });
            }
            
            // Function to update map center (called from React Native)
            function updateMapCenter(lat, lng) {
              map.setView([lat, lng], 15);
              marker.setLatLng([lat, lng]);
            }
          </script>
        </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location-selected') {
        setSelectedCoords({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        onChangeLocation(data.address, {
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
      // Use Nominatim API for geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchLocation(text);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSelectedCoords({ latitude: lat, longitude: lng });
    setMapCenter({ latitude: lat, longitude: lng });
    onChangeLocation(result.display_name, { latitude: lat, longitude: lng });
    
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
      const addressString = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim() || 
                           `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      onChangeLocation(addressString, { latitude, longitude });
      
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
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
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
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(result)}
                >
                  <Ionicons name="location" size={20} color="#6B7280" />
                  <Text style={styles.searchResultText} numberOfLines={2}>
                    {result.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
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
              Tap on the map, drag the marker, or search to select a location
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
    flex: 1,
    fontSize: 14,
    color: '#374151',
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
