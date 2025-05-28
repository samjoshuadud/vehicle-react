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
  vehicle_image?: string; // Base64 encoded image data
}

export interface MaintenanceLog {
  maintenance_id: number;
  vehicle_id: number;
  maintenance_type: string;
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
  liters: number;
  kwh: number;  // For electric vehicles
  cost: number;
  odometer_reading: number;
  fuel_type?: string;
  location?: string;
  full_tank?: boolean;
  notes?: string;
}

export interface Reminder {
  reminder_id: number;
  user_id: number;
  title: string;
  description?: string;
  due_date: string;
  repeat_interval?: string;
  mileage_interval?: number;
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

      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during login');
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    try {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during registration');
    }
  }

  async getUserProfile(token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get user profile');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during profile fetch');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401 || response.status === 403) {
        return false;
      }

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Vehicle management methods
  async getVehicles(token: string): Promise<Vehicle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get vehicles';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicles fetch');
    }
  }

  async createVehicle(token: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create vehicle');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle creation');
    }
  }

  async getVehicleById(token: string, vehicleId: number): Promise<Vehicle> {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get vehicle');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle fetch');
    }
  }

  async getMaintenanceLogs(token: string, vehicleId: number): Promise<MaintenanceLog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/maintenance/vehicle/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get maintenance logs');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance logs fetch');
    }
  }

  async getFuelLogs(token: string, vehicleId: number): Promise<FuelLog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/fuel/vehicle/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get fuel logs');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel logs fetch');
    }
  }

  async updateVehicle(token: string, vehicleId: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update vehicle');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle update');
    }
  }

  async deleteVehicle(token: string, vehicleId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete vehicle');
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during vehicle deletion');
    }
  }

  async createMaintenanceLog(token: string, maintenanceData: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
    try {
      const response = await fetch(`${this.baseUrl}/maintenance/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create maintenance log');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log creation');
    }
  }

  async updateMaintenanceLog(token: string, maintenanceId: number, maintenanceData: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
    try {
      const response = await fetch(`${this.baseUrl}/maintenance/${maintenanceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update maintenance log');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log update');
    }
  }

  async deleteMaintenanceLog(token: string, maintenanceId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/maintenance/${maintenanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete maintenance log');
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log deletion');
    }
  }

  async createFuelLog(token: string, fuelData: Partial<FuelLog>): Promise<FuelLog> {
    try {
      const response = await fetch(`${this.baseUrl}/fuel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fuelData),
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create fuel log');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log creation');
    }
  }

  async updateFuelLog(token: string, fuelId: number, fuelData: Partial<FuelLog>): Promise<FuelLog> {
    try {
      const response = await fetch(`${this.baseUrl}/fuel/${fuelId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fuelData),
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update fuel log');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log update');
    }
  }

  async deleteFuelLog(token: string, fuelId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/fuel/${fuelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete fuel log');
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log deletion');
    }
  }

  // Get individual maintenance log by ID
  async getMaintenanceById(token: string, maintenanceId: number): Promise<MaintenanceLog> {
    try {
      const response = await fetch(`${this.baseUrl}/maintenance/${maintenanceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch maintenance log');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during maintenance log fetch');
    }
  }

  // Get individual fuel log by ID
  async getFuelById(token: string, fuelId: number): Promise<FuelLog> {
    try {
      const response = await fetch(`${this.baseUrl}/fuel/${fuelId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch fuel log');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during fuel log fetch');
    }
  }

  // Get all reminders for user
  async getReminders(token: string): Promise<Reminder[]> {
    try {
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
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminders fetch');
    }
  }

  // Get upcoming reminders
  async getUpcomingReminders(token: string, days: number = 7): Promise<Reminder[]> {
    try {
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
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during upcoming reminders fetch');
    }
  }

  // Get overdue reminders
  async getOverdueReminders(token: string): Promise<Reminder[]> {
    try {
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
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during overdue reminders fetch');
    }
  }

  // Create reminder
  async createReminder(token: string, reminderData: Partial<Reminder>): Promise<Reminder> {
    try {
      console.log('Creating reminder with data:', reminderData);
      const response = await fetch(`${this.baseUrl}/reminders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      console.log('Create reminder response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to create reminder';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          // If response is not JSON (like HTML error page), use status-based message
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
          console.log('Failed to parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Successfully created reminder:', result);
      return result;
    } catch (error) {
      console.error('Error in createReminder:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder creation');
    }
  }

  // Get individual reminder by ID
  async getReminderById(token: string, reminderId: number): Promise<Reminder> {
    try {
      const response = await fetch(`${this.baseUrl}/reminders/${reminderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch reminder');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder fetch');
    }
  }

  // Update reminder
  async updateReminder(token: string, reminderId: number, reminderData: Partial<Reminder>): Promise<Reminder> {
    try {
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
        throw new Error(error.detail || 'Failed to update reminder');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder update');
    }
  }

  // Delete reminder
  async deleteReminder(token: string, reminderId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete reminder');
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during reminder deletion');
    }
  }
}

export const apiService = new ApiService();
