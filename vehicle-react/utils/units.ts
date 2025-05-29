
/**
 * Utility functions for unit conversions between metric and imperial systems
 */

export const convertDistance = (value: number, fromUnit: 'km' | 'mi', toUnit: 'km' | 'mi'): number => {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'km' && toUnit === 'mi') {
    return value * 0.621371; // km to miles
  } else if (fromUnit === 'mi' && toUnit === 'km') {
    return value * 1.60934; // miles to km
  }
  
  return value;
};

export const convertVolume = (value: number, fromUnit: 'L' | 'gal', toUnit: 'L' | 'gal'): number => {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'L' && toUnit === 'gal') {
    return value * 0.264172; // liters to US gallons
  } else if (fromUnit === 'gal' && toUnit === 'L') {
    return value * 3.78541; // US gallons to liters
  }
  
  return value;
};

export const formatDistance = (value: number, unit: 'km' | 'mi', precision: number = 1): string => {
  return `${value.toFixed(precision)} ${unit}`;
};

export const formatVolume = (value: number, unit: 'L' | 'gal', precision: number = 2): string => {
  return `${value.toFixed(precision)} ${unit}`;
};

export const formatFuelEfficiency = (distance: number, volume: number, distanceUnit: 'km' | 'mi', volumeUnit: 'L' | 'gal'): string => {
  if (volume === 0) return 'N/A';
  
  if (distanceUnit === 'km' && volumeUnit === 'L') {
    // km per liter
    const efficiency = distance / volume;
    return `${efficiency.toFixed(2)} km/L`;
  } else if (distanceUnit === 'mi' && volumeUnit === 'gal') {
    // miles per gallon
    const efficiency = distance / volume;
    return `${efficiency.toFixed(2)} mpg`;
  } else {
    // Mixed units - convert to consistent system
    const kmDistance = convertDistance(distance, distanceUnit, 'km');
    const literVolume = convertVolume(volume, volumeUnit, 'L');
    const efficiency = kmDistance / literVolume;
    return `${efficiency.toFixed(2)} km/L`;
  }
};
