import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export { isAbortError, createAbortController } from '../utils/requestUtils';

// FOR REAL DEVICE (USB connected, same WiFi)
// Use your computer's IP address - find it with 'ipconfig' command
// Example: http://192.168.1.100:5000/api

// FOR EMULATOR:
// const BASE_URL = 'http://10.0.2.2:5000/api';

// CURRENT SETUP FOR REAL DEVICE - CHANGE THIS IP TO YOUR COMPUTER'S IP
export const BASE_URL = 'https://apps.freebusinessgip.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let React Native set multipart boundary (manual Content-Type breaks uploads)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute =
      url.includes('/auth/register') || url.includes('/auth/login');
    if (error.response?.status === 401 && !isAuthRoute) {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
      delete error.config?.headers?.Authorization;
    }
    return Promise.reject(error);
  }
);

export default api;