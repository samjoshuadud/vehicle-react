import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types for our collections
export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  license: string;
  vin?: string;
  color?: string;
  mileage: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  userId: string;
  type: string; // 'oil_change', 'tire_rotation', 'brake_service', etc.
  description: string;
  mileage: number;
  cost: number;
  serviceProvider?: string;
  date: Timestamp;
  nextServiceMileage?: number;
  createdAt: Timestamp;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  userId: string;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  mileage: number;
  station?: string;
  date: Timestamp;
  createdAt: Timestamp;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  userId: string;
  title: string;
  description?: string;
  type: 'mileage' | 'date';
  targetMileage?: number;
  targetDate?: Timestamp;
  isCompleted: boolean;
  createdAt: Timestamp;
}

// Vehicle Services
export const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'vehicles'), {
      ...vehicleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

export const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId: string) => {
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

export const getUserVehicles = async (userId: string): Promise<Vehicle[]> => {
  try {
    const q = query(
      collection(db, 'vehicles'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vehicle));
  } catch (error) {
    console.error('Error getting user vehicles:', error);
    throw error;
  }
};

export const getVehicle = async (vehicleId: string): Promise<Vehicle | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'vehicles', vehicleId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Vehicle;
    }
    return null;
  } catch (error) {
    console.error('Error getting vehicle:', error);
    throw error;
  }
};

// Maintenance Log Services
export const addMaintenanceLog = async (logData: Omit<MaintenanceLog, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'maintenanceLogs'), {
      ...logData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding maintenance log:', error);
    throw error;
  }
};

export const getVehicleMaintenanceLogs = async (vehicleId: string): Promise<MaintenanceLog[]> => {
  try {
    const q = query(
      collection(db, 'maintenanceLogs'),
      where('vehicleId', '==', vehicleId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MaintenanceLog));
  } catch (error) {
    console.error('Error getting maintenance logs:', error);
    throw error;
  }
};

export const updateMaintenanceLog = async (logId: string, updates: Partial<MaintenanceLog>) => {
  try {
    const logRef = doc(db, 'maintenanceLogs', logId);
    await updateDoc(logRef, updates);
  } catch (error) {
    console.error('Error updating maintenance log:', error);
    throw error;
  }
};

export const deleteMaintenanceLog = async (logId: string) => {
  try {
    await deleteDoc(doc(db, 'maintenanceLogs', logId));
  } catch (error) {
    console.error('Error deleting maintenance log:', error);
    throw error;
  }
};

// Fuel Log Services
export const addFuelLog = async (logData: Omit<FuelLog, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'fuelLogs'), {
      ...logData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding fuel log:', error);
    throw error;
  }
};

export const getVehicleFuelLogs = async (vehicleId: string): Promise<FuelLog[]> => {
  try {
    const q = query(
      collection(db, 'fuelLogs'),
      where('vehicleId', '==', vehicleId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FuelLog));
  } catch (error) {
    console.error('Error getting fuel logs:', error);
    throw error;
  }
};

export const updateFuelLog = async (logId: string, updates: Partial<FuelLog>) => {
  try {
    const logRef = doc(db, 'fuelLogs', logId);
    await updateDoc(logRef, updates);
  } catch (error) {
    console.error('Error updating fuel log:', error);
    throw error;
  }
};

export const deleteFuelLog = async (logId: string) => {
  try {
    await deleteDoc(doc(db, 'fuelLogs', logId));
  } catch (error) {
    console.error('Error deleting fuel log:', error);
    throw error;
  }
};

// Reminder Services
export const addReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'reminders'), {
      ...reminderData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding reminder:', error);
    throw error;
  }
};

export const getVehicleReminders = async (vehicleId: string): Promise<Reminder[]> => {
  try {
    const q = query(
      collection(db, 'reminders'),
      where('vehicleId', '==', vehicleId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reminder));
  } catch (error) {
    console.error('Error getting reminders:', error);
    throw error;
  }
};

export const getUserReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      where('isCompleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reminder));
  } catch (error) {
    console.error('Error getting user reminders:', error);
    throw error;
  }
};

export const updateReminder = async (reminderId: string, updates: Partial<Reminder>) => {
  try {
    const reminderRef = doc(db, 'reminders', reminderId);
    await updateDoc(reminderRef, updates);
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
};

export const deleteReminder = async (reminderId: string) => {
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

export const completeReminder = async (reminderId: string) => {
  try {
    await updateReminder(reminderId, { isCompleted: true });
  } catch (error) {
    console.error('Error completing reminder:', error);
    throw error;
  }
};
