import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyUnauthorized } from './authSession';
import {
  getApiErrorMessage,
  isCloudflareBlockedError,
  sanitizeErrorText,
} from '../utils/apiError';

export { isAbortError, createAbortController } from '../utils/requestUtils';

export const API_ORIGIN = 'https://apps.freebusinessgip.com';
export const BASE_URL = `${API_ORIGIN}/api`;

// Chrome-like UA so Cloudflare / Hostinger WAF does not treat OkHttp as a bot.
export const APP_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 FreeBusiness/2.7.5';

export const APP_API_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': APP_USER_AGENT,
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: API_ORIGIN,
  Referer: `${API_ORIGIN}/`,
  'X-Requested-With': 'XMLHttpRequest',
  'X-FB-Client': 'FreeBusinessMobile',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: APP_API_HEADERS,
  withCredentials: true,
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
    config.headers['User-Agent'] = APP_USER_AGENT;
    config.headers.Accept = config.headers.Accept || 'application/json';
    config.headers['X-FB-Client'] = 'FreeBusinessMobile';
    config.headers.Origin = API_ORIGIN;
    if (Platform.OS) {
      config.headers['X-FB-Platform'] = Platform.OS;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const scrubHtmlResponse = (error) => {
  if (!error?.response) {
    return error;
  }

  const data = error.response.data;
  const contentType = String(
    error.response.headers?.['content-type'] ||
      error.response.headers?.['Content-Type'] ||
      ''
  ).toLowerCase();
  const asString = typeof data === 'string' ? data : '';

  const isHtml =
    contentType.includes('text/html') ||
    (typeof asString === 'string' &&
      asString.length > 0 &&
      (asString.includes('<html') ||
        asString.includes('<!DOCTYPE') ||
        asString.toLowerCase().includes('checking your browser') ||
        asString.toLowerCase().includes('just a moment') ||
        asString.toLowerCase().includes('cloudflare')));

  if (isHtml) {
    const message = getApiErrorMessage(
      error,
      'Server temporarily unavailable. Please try again.'
    );
    error.response.data = { message, error: message };
    error.message = message;
  } else if (typeof data === 'string') {
    const message = sanitizeErrorText(data, getApiErrorMessage(error));
    error.response.data = { message, error: message };
    if (!error.message || error.message.startsWith('Request failed')) {
      error.message = message;
    }
  }

  return error;
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    scrubHtmlResponse(error);

    const config = error.config;
    const challenge = isCloudflareBlockedError(error);
    const retryCount = config?.__cfRetryCount || 0;
    if (config && challenge && retryCount < 2) {
      config.__cfRetryCount = retryCount + 1;
      await sleep(1600 * config.__cfRetryCount);
      return api.request(config);
    }

    const url = config?.url || '';
    const isAuthRoute =
      url.includes('/auth/register') || url.includes('/auth/login');
    if (error.response?.status === 401 && !isAuthRoute) {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
      delete config?.headers?.Authorization;
      notifyUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
