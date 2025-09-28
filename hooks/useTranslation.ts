import { useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import translations from '../locales/translations.json';

type TranslationKey = keyof typeof translations.es;

export function useTranslation() {
  const [isLoading, setIsLoading] = useState(true);
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const deviceLocale = 'es'; // Force Spanish
        setLocale(deviceLocale);
      } catch (error) {
        console.error('Error loading language:', error);
        setLocale('es');
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const t = (key: TranslationKey): string => {
    return translations[locale as keyof typeof translations]?.[key] || translations.es[key] || key;
  };

  return { t, isLoading };
}