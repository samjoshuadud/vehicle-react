const API_BASE_URL = 'http://192.168.100.200:8000'; // Backend server IP

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  mileage_type: string;
  dark_mode: boolean;
}

export interface Vehicle {
  vehicle_id: number;
  user_id: number;
  make: string;
  model: string;
  year: number;
  color?: string;
  license_plate?: string;
  vin?: string;
  current_mileage: number;
  fuel_type?: string;
  purchase_date?: string;
  vehicle_image_url?: string;
}

export interface MaintenanceLog {
  maintenance_id: number;
  vehicle_id: number;
  type: string;
  description: string;
  date: string;
  mileage: number;
  cost: number;
  location?: string;
  notes?: string;
}

export interface FuelLog {
  fuel_id: number;
  vehicle_id: number;
  date: string;
  mileage: number;
  fuel_amount: number;
  cost: number;
  fuel_type?: string;
  location?: string;
  notes?: string;
}

export interface Reminder {
  reminder_id: number;
  user_id: number;
  title: string;
  description?: string;
  due_date: string;
  repeat_interval?: string;
}

export interface LoginRequest {
  username: string; // FastAPI uses 'username' for OAuth2PasswordRequestForm
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  mileage_type?: string;
  dark_mode?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const formData = new FormData();
      formData.append('username', email); // FastAPI expects 'username' for email
      formData.append('password', password);

      console.log('Attempting login for:', email);
      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        body: formData,
      });

      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Login error:', error);
        throw new Error(error.detail || 'Login failed');
      }

      const result = await response.json();
      console.log('Login successful');
      return result;
    } catch (error) {
      console.error('Login network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during login');
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    try {
      console.log('Attempting registration for:', userData.email);
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: userData.full_name,
          email: userData.email,
          password: userData.password,
          mileage_type: userData.mileage_type || 'kilometers',
          dark_mode: userData.dark_mode || false,
        }),
      });

      console.log('Registration response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Registration error:', error);
        throw new Error(error.detail || 'Registration failed');
      }

      const result = await response.json();
      console.log('Registration successful');
      return result;
    } catch (error) {
      console.error('Registration network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during registration');
    }
  }

  async getUserProfile(token: string): Promise<User> {
    try {
      console.log('Fetching user profile...');
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('User profile response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('User profile error:', error);
        throw new Error(error.detail || 'Failed to get user profile');
      }

      const result = await response.json();
      console.log('User profile fetched successfully');
      return result;
    } catch (error) {
      console.error('User profile network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during profile fetch');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      console.log('Validating token...');
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Token validation response status:', response.status);
      
      if (response.status === 401 || response.status === 403) {
        console.log('Token is invalid or expired');
        return false;
      }

      if (!response.ok) {
        console.log('Token validation failed with status:', response.status);
        return false;
      }

      console.log('Token is valid');
      return true;
    } catch (error) {
      console.error('Token validation network error:', error);
      return false;
    }
  }

  // Vehicle management methods
  async getVehicles(token: string): Promise<Vehicle[]> {
    try {
      console.log('Fetching vehicles...');
      const response = await fetch(`${this.baseUrl}/vehicles/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Vehicles response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to get vehicles';
        try {
          const error = await response.json();
          console.error('Vehicles error:', error);
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response, likely HTML:', parseError);
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Vehicles fetched successfully');
      return result;
    } catch (error) {
      console.error('Vehicles network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicles fetch');
    }
  }

  async createVehicle(token: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      console.log('Creating vehicle...');
      const response = await fetch(`${this.baseUrl}/vehicles/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      console.log('Create vehicle response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Create vehicle error:', error);
        throw new Error(error.detail || 'Failed to create vehicle');
      }

      const result = await response.json();
      console.log('Vehicle created successfully');
      return result;
    } catch (error) {
      console.error('Create vehicle network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle creation');
    }
  }

  async getVehicleById(token: string, vehicleId: number): Promise<Vehicle> {
    try {
      console.log('Fetching vehicle by ID:', vehicleId);
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Vehicle by ID response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Vehicle by ID error:', error);
        throw new Error(error.detail || 'Failed to get vehicle');
      }

      const result = await response.json();
      console.log('Vehicle fetched successfully');
      return result;
    } catch (error) {
      console.error('Vehicle by ID network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle fetch');
    }
  }

  async getMaintenanceLogs(token: string, vehicleId: number): Promise<MaintenanceLog[]> {
    try {
      console.log('Fetching maintenance logs for vehicle:', vehicleId);
      const response = await fetch(`${this.baseUrl}/maintenance/vehicle/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Maintenance logs response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Maintenance logs error:', error);
        throw new Error(error.detail || 'Failed to get maintenance logs');
      }

      const result = await response.json();
      console.log('Maintenance logs fetched successfully');
      return result;
    } catch (error) {
      console.error('Maintenance logs network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance logs fetch');
    }
  }

  async getFuelLogs(token: string, vehicleId: number): Promise<FuelLog[]> {
    try {
      console.log('Fetching fuel logs for vehicle:', vehicleId);
      const response = await fetch(`${this.baseUrl}/fuel/vehicle/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Fuel logs response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Fuel logs error:', error);
        throw new Error(error.detail || 'Failed to get fuel logs');
      }

      const result = await response.json();
      console.log('Fuel logs fetched successfully');
      return result;
    } catch (error) {
      console.error('Fuel logs network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel logs fetch');
    }
  }

  async updateVehicle(token: string, vehicleId: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      console.log('Updating vehicle:', vehicleId);
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      console.log('Update vehicle response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Update vehicle error:', error);
        throw new Error(error.detail || 'Failed to update vehicle');
      }

      const result = await response.json();
      console.log('Vehicle updated successfully');
      return result;
    } catch (error) {
      console.error('Update vehicle network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle update');
    }
  }

  async deleteVehicle(token: string, vehicleId: number): Promise<void> {
    try {
      console.log('Deleting vehicle:', vehicleId);
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete vehicle response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Delete vehicle error:', error);
        throw new Error(error.detail || 'Failed to delete vehicle');
      }

      console.log('Vehicle deleted successfully');
    } catch (error) {
      console.error('Delete vehicle network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle deletion');
    }
  }

  async createMaintenanceLog(token: string, maintenanceData: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
    try {
      console.log('Creating maintenance log...');
      const response = await fetch(`${this.baseUrl}/maintenance/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });

      console.log('Create maintenance log response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Create maintenance log error:', error);
        throw new Error(error.detail || 'Failed to create maintenance log');
      }

      const result = await response.json();
      console.log('Maintenance log created successfully');
      return result;
    } catch (error) {
      console.error('Create maintenance log network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log creation');
    }
  }

  async updateMaintenanceLog(token: string, maintenanceId: number, maintenanceData: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
    try {
      console.log('Updating maintenance log:', maintenanceId);
      const response = await fetch(`${this.baseUrl}/maintenance/${maintenanceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });

      console.log('Update maintenance log response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Update maintenance log error:', error);
        throw new Error(error.detail || 'Failed to update maintenance log');
      }

      const result = await response.json();
      console.log('Maintenance log updated successfully');
      return result;
    } catch (error) {
      console.error('Update maintenance log network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log update');
    }
  }

  async deleteMaintenanceLog(token: string, maintenanceId: number): Promise<void> {
    try {
      console.log('Deleting maintenance log:', maintenanceId);
      const response = await fetch(`${this.baseUrl}/maintenance/${maintenanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete maintenance log response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Delete maintenance log error:', error);
        throw new Error(error.detail || 'Failed to delete maintenance log');
      }

      console.log('Maintenance log deleted successfully');
    } catch (error) {
      console.error('Delete maintenance log network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log deletion');
    }
  }

  async createFuelLog(token: string, fuelData: Partial<FuelLog>): Promise<FuelLog> {
    try {
      console.log('Creating fuel log...');
      const response = await fetch(`${this.baseUrl}/fuel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fuelData),
      });

      console.log('Create fuel log response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Create fuel log error:', error);
        throw new Error(error.detail || 'Failed to create fuel log');
      }

      const result = await response.json();
      console.log('Fuel log created successfully');
      return result;
    } catch (error) {
      console.error('Create fuel log network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log creation');
    }
  }

  async updateFuelLog(token: string, fuelId: number, fuelData: Partial<FuelLog>): Promise<FuelLog> {
    try {
      console.log('Updating fuel log:', fuelId);
      const response = await fetch(`${this.baseUrl}/fuel/${fuelId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fuelData),
      });

      console.log('Update fuel log response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Update fuel log error:', error);
        throw new Error(error.detail || 'Failed to update fuel log');
      }

      const result = await response.json();
      console.log('Fuel log updated successfully');
      return result;
    } catch (error) {
      console.error('Update fuel log network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log update');
    }
  }

  async deleteFuelLog(token: string, fuelId: number): Promise<void> {
    try {
      console.log('Deleting fuel log:', fuelId);
      const response = await fetch(`${this.baseUrl}/fuel/${fuelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete fuel log response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Delete fuel log error:', error);
        throw new Error(error.detail || 'Failed to delete fuel log');
      }

      console.log('Fuel log deleted successfully');
    } catch (error) {
      console.error('Delete fuel log network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log deletion');
    }
  }

  // Get individual maintenance log by ID
  async getMaintenanceById(token: string, maintenanceId: number): Promise<MaintenanceLog> {
    try {
      console.log('Fetching maintenance log:', maintenanceId);
      const response = await fetch(`${this.baseUrl}/maintenance/${maintenanceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Get maintenance error:', error);
        throw new Error(error.detail || 'Failed to fetch maintenance log');
      }

      const result = await response.json();
      console.log('Maintenance log fetched successfully');
      return result;
    } catch (error) {
      console.error('Get maintenance network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log fetch');
    }
  }

  // Get individual fuel log by ID
  async getFuelById(token: string, fuelId: number): Promise<FuelLog> {
    try {
      console.log('Fetching fuel log:', fuelId);
      const response = await fetch(`${this.baseUrl}/fuel/${fuelId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Get fuel error:', error);
        throw new Error(error.detail || 'Failed to fetch fuel log');
      }

      const result = await response.json();
      console.log('Fuel log fetched successfully');
      return result;
    } catch (error) {
      console.error('Get fuel network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log fetch');
    }
  }

  // Get all reminders for user
  async getReminders(token: string): Promise<Reminder[]> {
    try {
      console.log('Fetching reminders...');
      const response = await fetch(`${this.baseUrl}/reminders/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch reminders';
        try {
          const error = await response.json();
          console.error('Get reminders error:', error);
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response, likely HTML:', parseError);
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Reminders fetched successfully');
      return result;
    } catch (error) {
      console.error('Get reminders network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminders fetch');
    }
  }

  // Get upcoming reminders
  async getUpcomingReminders(token: string, days: number = 7): Promise<Reminder[]> {
    try {
      console.log('Fetching upcoming reminders...');
      const response = await fetch(`${this.baseUrl}/reminders/upcoming?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch upcoming reminders';
        try {
          const error = await response.json();
          console.error('Get upcoming reminders error:', error);
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response, likely HTML:', parseError);
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Upcoming reminders fetched successfully');
      return result;
    } catch (error) {
      console.error('Get upcoming reminders network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during upcoming reminders fetch');
    }
  }

  // Get overdue reminders
  async getOverdueReminders(token: string): Promise<Reminder[]> {
    try {
      console.log('Fetching overdue reminders...');
      const response = await fetch(`${this.baseUrl}/reminders/overdue`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch overdue reminders';
        try {
          const error = await response.json();
          console.error('Get overdue reminders error:', error);
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response, likely HTML:', parseError);
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Overdue reminders fetched successfully');
      return result;
    } catch (error) {
      console.error('Get overdue reminders network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during overdue reminders fetch');
    }
  }

  // Create reminder
  async createReminder(token: string, reminderData: Partial<Reminder>): Promise<Reminder> {
    try {
      console.log('Creating reminder...');
      const response = await fetch(`${this.baseUrl}/reminders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Create reminder error:', error);
        throw new Error(error.detail || 'Failed to create reminder');
      }

      const result = await response.json();
      console.log('Reminder created successfully');
      return result;
    } catch (error) {
      console.error('Create reminder network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder creation');
    }
  }

  // Get individual reminder by ID
  async getReminderById(token: string, reminderId: number): Promise<Reminder> {
    try {
      console.log('Fetching reminder:', reminderId);
      const response = await fetch(`${this.baseUrl}/reminders/${reminderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Get reminder error:', error);
        throw new Error(error.detail || 'Failed to fetch reminder');
      }

      const result = await response.json();
      console.log('Reminder fetched successfully');
      return result;
    } catch (error) {
      console.error('Get reminder network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder fetch');
    }
  }

  // Update reminder
  async updateReminder(token: string, reminderId: number, reminderData: Partial<Reminder>): Promise<Reminder> {
    try {
      console.log('Updating reminder:', reminderId);
      const response = await fetch(`${this.baseUrl}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Update reminder error:', error);
        throw new Error(error.detail || 'Failed to update reminder');
      }

      const result = await response.json();
      console.log('Reminder updated successfully');
      return result;
    } catch (error) {
      console.error('Update reminder network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder update');
    }
  }

  // Delete reminder
  async deleteReminder(token: string, reminderId: number): Promise<void> {
    try {
      console.log('Deleting reminder:', reminderId);
      const response = await fetch(`${this.baseUrl}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Delete reminder error:', error);
        throw new Error(error.detail || 'Failed to delete reminder');
      }

      console.log('Reminder deleted successfully');
    } catch (error) {
      console.error('Delete reminder network error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder deletion');
    }
  }
}

export const apiService = new ApiService();
