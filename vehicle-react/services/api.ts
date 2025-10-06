
// Change accordingly (if changed machine or changed network)
// const API_BASE_URL = 'http://192.168.87.15:8000'; // Backend server IP
// export const API_BASE_URL = 'http://192.168.100.114:8000';
  export const API_BASE_URL = 'http://172.20.10.3:8000';


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
  liters?: number;  // Optional - only for gas vehicles
  kwh?: number;  // Optional - only for electric vehicles
  cost: number;
  location?: string;
  latitude?: number;  // For fuel price tracking
  longitude?: number;  // For fuel price tracking
  normalized_location?: string;  // Simplified location name
  station_cluster_id?: string;  // For grouping nearby stations
  full_tank?: boolean;
  notes?: string;
}

export interface Reminder {
  reminder_id: number;
  title: string;
  description: string | null;
  due_date: string;
  repeat_interval: string | null;
  mileage_interval: number | null;
  user_id: number;
  vehicle_id: number;
  created_at: string;
  updated_at: string;
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

  // Helper method to safely parse error responses
  private async parseErrorResponse(response: Response, defaultMessage: string): Promise<string> {
    try {
      const error = await response.json();
      
      // Handle different error response formats
      if (error.detail) {
        // If detail is a string, return it directly
        if (typeof error.detail === 'string') {
          return error.detail;
        }
        
        // If detail is an array (validation errors), format them nicely
        if (Array.isArray(error.detail)) {
          return error.detail
            .map((err: any) => err.msg || 'Validation error')
            .join(', ');
        }
        
        // If detail is an object, try to stringify it
        return JSON.stringify(error.detail);
      }
      
      // Fallback to message field or default message
      return error.message || defaultMessage;
    } catch (parseError) {
      // If response is not JSON, use the status text or default message
      return response.statusText || defaultMessage;
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Manually create form-encoded data to ensure compatibility
      const formData = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorMessage = await this.parseErrorResponse(response, 'Login failed');
        throw new Error(errorMessage);
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

  async updateUser(token: string, userData: Partial<User>): Promise<User> {
    try {
      console.log('🌐 API: Making PUT request to update user:', userData);
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 API: Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API: Error response:', error);
        throw new Error(error.detail || `HTTP ${response.status}: Failed to update user profile`);
      }

      const result = await response.json();
      console.log('✅ API: User updated successfully:', result);
      return result;
    } catch (error) {
      console.error('💥 API: Update user error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during user profile update');
    }
  }

  async deleteUser(token: string): Promise<void> {
    try {
      console.log('🗑️ API: Making DELETE request to delete user account');
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API: Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete account';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          errorMessage = response.status === 401 ? 'Authentication failed' : `Server error (${response.status})`;
        }
        console.error('❌ API: Error response:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ API: User account deleted successfully');
    } catch (error) {
      console.error('💥 API: Delete user error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error during account deletion');
    }
  }

  async requestPasswordReset(email: string): Promise<{message: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to request password reset';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (jsonError) {
          // If response isn't JSON, get text content
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a JSON parsing error
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          throw new Error('Server connection error. Please check if the backend server is running.');
        }
        throw error;
      }
      throw new Error('Network error during password reset request');
    }
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<{message: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reset password';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (jsonError) {
          // If response isn't JSON, get text content
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a JSON parsing error
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          throw new Error('Server connection error. Please check if the backend server is running.');
        }
        throw error;
      }
      throw new Error('Network error during password reset');
    }
  }

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<{message: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to change password';
        try {
          const error = await response.json();
          
          // Handle specific error cases
          if (error.detail) {
            if (error.detail.includes('current password') || error.detail.includes('incorrect')) {
              errorMessage = 'Current password is incorrect. Please try again.';
            } else if (error.detail.includes('same') || error.detail.includes('different')) {
              errorMessage = 'New password must be different from your current password.';
            } else if (error.detail.includes('validation') || error.detail.includes('requirements')) {
              errorMessage = 'New password does not meet security requirements.';
            } else {
              errorMessage = error.detail;
            }
          } else if (response.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
          } else if (response.status === 422) {
            errorMessage = 'Current password is incorrect. Please verify and try again.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        } catch (jsonError) {
          // If response isn't JSON, provide status-based error
          if (response.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
          } else if (response.status === 422) {
            errorMessage = 'Current password is incorrect. Please verify and try again.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a network/connection error
        if (error.message.includes('fetch') || error.message.includes('network') || 
            error.message.includes('connection') || error.message.includes('NETWORK_REQUEST_FAILED')) {
          throw new Error('Connection error. Please check your internet connection and try again.');
        }
        // Check if it's a JSON parsing error (server not responding properly)
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          throw new Error('Server connection error. Please check if the backend server is running.');
        }
        throw error;
      }
      throw new Error('Network error during password change');
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
      console.log('🔧 Creating maintenance log with data:', JSON.stringify(maintenanceData, null, 2));
      
      const response = await fetch(`${this.baseUrl}/maintenance/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });

      console.log('📡 Maintenance log creation response status:', response.status);

      if (!response.ok) {
        const errorMessage = await this.parseErrorResponse(response, 'Failed to create maintenance log');
        console.error('❌ Maintenance log creation failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Maintenance log created successfully:', result);
      return result;
    } catch (error) {
      console.error('💥 Error in createMaintenanceLog:', error);
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
