export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string;
  image: string;
  mileage: number;
  fuelType: string;
  purchaseDate: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  description: string;
  mileage: number;
  cost: number;
  location: string;
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  kwh?: number;  // For electric vehicles
  cost: number;
  mileage: number;
  location: string;
  isFull: boolean;
  notes?: string;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  date: string;
  isCompleted: boolean;
  repeatInterval?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'mileage';
  mileageInterval?: number;
}

export const vehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2019,
    color: 'Silver',
    licensePlate: 'ABC123',
    vin: '1HGCM82633A123456',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1936&auto=format&fit=crop',
    mileage: 35000,
    fuelType: 'Gasoline',
    purchaseDate: '2019-06-15',
  },
  {
    id: '2',
    make: 'Honda',
    model: 'CR-V',
    year: 2021,
    color: 'Blue',
    licensePlate: 'XYZ789',
    vin: '5J8TB4H54LL123456',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop',
    mileage: 12000,
    fuelType: 'Gasoline',
    purchaseDate: '2021-03-10',
  },
  {
    id: '3',
    make: 'Tesla',
    model: 'Model 3',
    year: 2022,
    color: 'Red',
    licensePlate: 'EV1234',
    vin: '5YJ3E1EA8LF123456',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop',
    mileage: 8000,
    fuelType: 'Electric',
    purchaseDate: '2022-01-20',
  },
];

export const maintenanceLogs: MaintenanceLog[] = [
  {
    id: '1',
    vehicleId: '1',
    date: '2023-02-15',
    type: 'Oil Change',
    description: 'Regular oil change with filter replacement',
    mileage: 32000,
    cost: 45.99,
    location: 'Quick Lube',
    notes: 'Used synthetic oil',
  },
  {
    id: '2',
    vehicleId: '1',
    date: '2023-05-20',
    type: 'Tire Rotation',
    description: 'Rotated and balanced all tires',
    mileage: 34000,
    cost: 30.00,
    location: 'Discount Tire',
  },
  {
    id: '3',
    vehicleId: '2',
    date: '2023-04-10',
    type: 'Oil Change',
    description: 'Regular oil change with filter replacement',
    mileage: 10000,
    cost: 49.99,
    location: 'Honda Dealership',
    notes: 'Also performed multi-point inspection',
  },
  {
    id: '4',
    vehicleId: '3',
    date: '2023-03-05',
    type: 'Tire Replacement',
    description: 'Replaced all four tires',
    mileage: 6000,
    cost: 800.00,
    location: 'Tire Shop',
    notes: 'Upgraded to all-season performance tires',
  },
];

export const fuelLogs: FuelLog[] = [
  {
    id: '1',
    vehicleId: '1',
    date: '2023-06-01',
    liters: 45.5,
    cost: 2775.50, // ~61 PHP/L
    mileage: 34500,
    location: 'Shell',
    isFull: true,
  },
  {
    id: '2',
    vehicleId: '1',
    date: '2023-06-15',
    liters: 42.8,
    cost: 2611.00,
    mileage: 34900,
    location: 'Petron',
    isFull: true,
  },
  {
    id: '3',
    vehicleId: '2',
    date: '2023-06-10',
    liters: 0, // Electric vehicle
    cost: 350.00,
    mileage: 12500,
    location: 'Home Charger',
    isFull: true,
  }
];

export const reminders: Reminder[] = [
  {
    id: '1',
    vehicleId: '1',
    title: 'Oil Change',
    description: 'Schedule oil change service',
    date: '2023-08-15',
    isCompleted: false,
    repeatInterval: 'mileage',
    mileageInterval: 5000,
  },
  {
    id: '2',
    vehicleId: '1',
    title: 'Registration Renewal',
    description: 'Renew vehicle registration',
    date: '2023-12-01',
    isCompleted: false,
    repeatInterval: 'yearly',
  },
  {
    id: '3',
    vehicleId: '2',
    title: 'Tire Rotation',
    description: 'Rotate tires for even wear',
    date: '2023-09-10',
    isCompleted: false,
    repeatInterval: 'mileage',
    mileageInterval: 6000,
  },
  {
    id: '4',
    vehicleId: '3',
    title: 'Software Update',
    description: 'Check for Tesla software updates',
    date: '2023-07-15',
    isCompleted: false,
    repeatInterval: 'monthly',
  },
];
