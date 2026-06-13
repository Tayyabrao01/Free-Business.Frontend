import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  setStoredLanguage,
  translate,
} from '../services/LanguageService';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadLanguage = async () => {
      const stored = await getStoredLanguage();
      if (mounted) {
        setLanguage(stored);
        setReady(true);
      }
    };

    loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const changeLanguage = useCallback(async (nextLanguage) => {
    const saved = await setStoredLanguage(nextLanguage);
    setLanguage(saved);
    return saved;
  }, []);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      ready,
      isUrdu: language === 'ur',
      setLanguage: changeLanguage,
      t,
    }),
    [language, ready, changeLanguage, t]
  );

  if (!ready) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  return context;
};

export default useTranslation;
