import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

const STORAGE_KEY = '@freebusiness_language';

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'ur'];

const translations = {
  en,
  ur,
};

export const getTranslations = (language) => {
  return translations[language] || translations[DEFAULT_LANGUAGE];
};

export const getNestedValue = (obj, key) => {
  if (!obj || !key) {
    return undefined;
  }

  return key.split('.').reduce((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return current[part];
    }
    return undefined;
  }, obj);
};

export const interpolate = (text, params = {}) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return Object.keys(params).reduce((result, paramKey) => {
    return result.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(params[paramKey]));
  }, text);
};

export const translate = (language, key, params) => {
  const dictionary = getTranslations(language);
  const value = getNestedValue(dictionary, key);

  if (value === undefined) {
    return key;
  }

  if (typeof value !== 'string') {
    return key;
  }

  return interpolate(value, params);
};

export const getStoredLanguage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }
  } catch (error) {
    console.error('Failed to load language:', error);
  }

  return DEFAULT_LANGUAGE;
};

export const setStoredLanguage = async (language) => {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    return lang;
  } catch (error) {
    console.error('Failed to save language:', error);
    return DEFAULT_LANGUAGE;
  }
};

export default {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getTranslations,
  getNestedValue,
  interpolate,
  translate,
  getStoredLanguage,
  setStoredLanguage,
};
