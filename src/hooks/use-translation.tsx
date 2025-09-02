'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from './use-local-storage';
import deTranslations from '@/locales/de.json';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

const translations: Record<string, any> = {
  de: deTranslations,
  en: enTranslations,
  ar: arTranslations,
};

const languages = {
    'en': 'English',
    'de': 'Deutsch',
    'ar': 'العربية'
}

type LanguageContextType = {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  languages: Record<string, string>;
  dir: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useLocalStorage('language', 'ar');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language, isMounted]);

  const t = (key: string): string => {
    // Fallback to the key itself if the translation is not found
    return translations[language]?.[key] || key;
  };
  
  const dir = useMemo(() => (language === 'ar' ? 'rtl' : 'ltr'), [language]);


  if (!isMounted) {
      // Render nothing on the server and on the initial client-side render
      return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages, dir }}>
         {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
