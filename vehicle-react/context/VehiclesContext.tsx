import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService, Vehicle } from '../services/api';
import { useAuth } from './AuthContext';

interface VehiclesContextProps {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  isLoading: boolean;
  refreshVehicles: () => Promise<void>;
  setCurrentVehicle: (vehicle: Vehicle | null) => void;
  addVehicle: (vehicleData: Partial<Vehicle>) => Promise<Vehicle>;
  updateVehicle: (vehicleId: number, vehicleData: Partial<Vehicle>) => Promise<Vehicle>;
  deleteVehicle: (vehicleId: number) => Promise<void>;
}

const VehiclesContext = createContext<VehiclesContextProps | null>(null);

export const useVehicles = () => {
  const context = useContext(VehiclesContext);
  if (!context) {
    throw new Error('useVehicles must be used within a VehiclesProvider');
  }
  return context;
};

export const VehiclesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshVehicles();
    } else {
      // Clear vehicles when not authenticated
      setVehicles([]);
      setCurrentVehicle(null);
      setIsLoading(false); // Ensure loading is false when not authenticated
    }
  }, [isAuthenticated, token]);

  const refreshVehicles = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      console.log('VehiclesContext: Refreshing vehicles');
      const vehiclesList = await apiService.getVehicles(token);
      setVehicles(vehiclesList);
      
      // If no current vehicle is set and we have vehicles, set the first one as current
      if (!currentVehicle && vehiclesList.length > 0) {
        setCurrentVehicle(vehiclesList[0]);
      }
      
      console.log('VehiclesContext: Vehicles refreshed successfully');
    } catch (error) {
      console.error('VehiclesContext: Failed to refresh vehicles', error);
      // Clear vehicles on error to prevent stale data
      setVehicles([]);
      setCurrentVehicle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addVehicle = async (vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      console.log('VehiclesContext: Adding new vehicle');
      const newVehicle = await apiService.createVehicle(token, vehicleData);
      setVehicles(prev => [...prev, newVehicle]);
      
      // If this is the first vehicle, make it the current one
      if (vehicles.length === 0) {
        setCurrentVehicle(newVehicle);
      }
      
      console.log('VehiclesContext: Vehicle added successfully');
      return newVehicle;
    } catch (error) {
      console.error('VehiclesContext: Failed to add vehicle', error);
      throw error;
    }
  };

  const updateVehicle = async (vehicleId: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      console.log('VehiclesContext: Updating vehicle', vehicleId);
      const updatedVehicle = await apiService.updateVehicle(token, vehicleId, vehicleData);
      
      // Update the vehicle in the local state
      setVehicles(prev => prev.map(v => 
        v.vehicle_id === vehicleId ? updatedVehicle : v
      ));
      
      // Update current vehicle if it's the one being updated
      if (currentVehicle?.vehicle_id === vehicleId) {
        setCurrentVehicle(updatedVehicle);
      }
      
      console.log('VehiclesContext: Vehicle updated successfully');
      return updatedVehicle;
    } catch (error) {
      console.error('VehiclesContext: Failed to update vehicle', error);
      throw error;
    }
  };

  const deleteVehicle = async (vehicleId: number): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      console.log('VehiclesContext: Deleting vehicle', vehicleId);
      await apiService.deleteVehicle(token, vehicleId);
      
      // Remove the vehicle from local state
      setVehicles(prev => prev.filter(v => v.vehicle_id !== vehicleId));
      
      // If the deleted vehicle was the current one, set a new current vehicle
      if (currentVehicle?.vehicle_id === vehicleId) {
        const remainingVehicles = vehicles.filter(v => v.vehicle_id !== vehicleId);
        setCurrentVehicle(remainingVehicles.length > 0 ? remainingVehicles[0] : null);
      }
      
      console.log('VehiclesContext: Vehicle deleted successfully');
    } catch (error) {
      console.error('VehiclesContext: Failed to delete vehicle', error);
      throw error;
    }
  };

  const value = {
    vehicles,
    currentVehicle,
    isLoading,
    refreshVehicles,
    setCurrentVehicle,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };

  return (
    <VehiclesContext.Provider value={value}>
      {children}
    </VehiclesContext.Provider>
  );
};
