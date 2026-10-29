import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';
import { disconnectStreamClients } from '../services/streamClientService';
import { setUnauthorizedHandler } from '../services/authSession';
import { normalizePhone } from '../services/phoneOtpService';
import {
  ensureNotificationsReady,
  requestNotificationPermission,
} from '../services/NotificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeUser = (userData) => {
    if (!userData) {
      return null;
    }
    return {
      ...userData,
      _id: userData._id || userData.id,
    };
  };

  const register = async (name, email, phone, whatsappNumber, password, location, referralCode) => {
    try {
      delete api.defaults.headers.Authorization;
      await AsyncStorage.multiRemove(['token', 'user']);
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: String(phone).trim(),
        whatsappNumber: String(whatsappNumber).trim(),
        password,
        location: (location && String(location).trim()) || 'Not specified',
      };
      if (referralCode?.trim()) {
        payload.referralCode = referralCode.trim().toUpperCase();
      }
      const response = await api.post('/auth/register', payload);
      const { token, user: rawUser } = response.data;
      const user = normalizeUser(rawUser);

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.Authorization = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      ensureNotificationsReady().catch(() => {});
      requestNotificationPermission().catch(() => {});
      return { success: true };
    } catch (error) {
      if (!error.response) {
        return {
          success: false,
          error: 'No internet connection or server unreachable. Check your network and try again.',
        };
      }
      let message = getApiErrorMessage(error, 'Registration failed');
      if (error.response?.status === 500 && String(message).includes('JWT_SECRET')) {
        message = 'Server not configured. Contact support or try again later.';
      }
      return { success: false, error: message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const { token, user: rawUser } = response.data;
      const user = normalizeUser(rawUser);

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.Authorization = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      ensureNotificationsReady().catch(() => {});
      requestNotificationPermission().catch(() => {});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'Login failed'),
      };
    }
  };

  const loginWithOtp = async ({ idToken, name, email, phone, whatsappNumber, location, referralCode }) => {
    try {
      const payload = {
        idToken,
        name: name?.trim(),
        email: email?.trim()?.toLowerCase(),
        phone: normalizePhone(phone),
        whatsappNumber: normalizePhone(whatsappNumber || phone),
        location: (location && String(location).trim()) || 'Not specified',
      };
      if (referralCode?.trim()) {
        payload.referralCode = referralCode.trim().toUpperCase();
      }

      const response = await api.post('/auth/otp/verify', payload);
      const { token, user: rawUser } = response.data;
      const nextUser = normalizeUser(rawUser);

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(nextUser));

      api.defaults.headers.Authorization = `Bearer ${token}`;
      setToken(token);
      setUser(nextUser);
      ensureNotificationsReady().catch(() => {});
      requestNotificationPermission().catch(() => {});
      return { success: true, user: nextUser };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'OTP login failed'),
      };
    }
  };

  const verifyRegisterOtp = async (email, code) => {
    try {
      delete api.defaults.headers.Authorization;
      await AsyncStorage.multiRemove(['token', 'user']);
      const response = await api.post('/auth/register/verify', { email, code });
      const { token, user: rawUser } = response.data;
      const nextUser = normalizeUser(rawUser);

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(nextUser));

      api.defaults.headers.Authorization = `Bearer ${token}`;
      setToken(token);
      setUser(nextUser);
      ensureNotificationsReady().catch(() => {});
      requestNotificationPermission().catch(() => {});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'Registration verification failed'),
      };
    }
  };

  const sendRegisterOtp = async (payload) => {
    try {
      await api.post('/otp/send-otp', {
        email: payload.email,
        purpose: 'register',
        payload,
      });
      return { success: true };
    } catch (error) {
      console.warn('[register] send OTP failed:', error?.response?.status, error?.response?.data);
      return {
        success: false,
        error: getApiErrorMessage(error, 'Could not send verification email. Check your internet and try again.'),
      };
    }
  };

  const logout = async () => {
    await disconnectStreamClients();
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.Authorization;
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const updateStoredUser = async (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    await AsyncStorage.setItem('user', JSON.stringify(normalized));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        register,
        login,
        loginWithOtp,
        sendRegisterOtp,
        verifyRegisterOtp,
        logout,
        setUser: updateStoredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };