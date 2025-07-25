import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class AuthService {
  constructor() {
    this.user = null;
    this.token = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);
      
      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
        apiClient.setToken(token);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  async login(email, password) {
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        
        this.token = token;
        this.user = user;
        apiClient.setToken(token);
        
        return { success: true, user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.register(userData);
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        
        this.token = token;
        this.user = user;
        apiClient.setToken(token);
        
        return { success: true, user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async logout() {
    try {
      // Call logout API
      await apiClient.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API response
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      this.token = null;
      this.user = null;
      apiClient.setToken(null);
    }
  }

  async getCurrentUser() {
    try {
      if (!this.token) {
        return null;
      }

      const response = await apiClient.getProfile();
      
      if (response.success) {
        this.user = response.data.user;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user));
        return this.user;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      // If token is invalid, clear auth data
      await this.logout();
      return null;
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  async updateUser(userData) {
    try {
      this.user = { ...this.user, ...userData };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user));
    } catch (error) {
      console.error('Update user data error:', error);
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
