import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import heTranslation from './locales/he.json';
import enTranslation from './locales/en.json';

const resources = {
  he: {
    translation: heTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

// Function to update document direction
const updateDirection = (language: string) => {
  const isRTL = language === 'he';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
  document.body.dir = isRTL ? 'rtl' : 'ltr';
  
  // Update #root direction
  const root = document.getElementById('root');
  if (root) {
    root.dir = isRTL ? 'rtl' : 'ltr';
  }
  
  // Update CSS custom properties for direction-aware styling
  document.documentElement.style.setProperty('--text-align', isRTL ? 'right' : 'left');
  document.documentElement.style.setProperty('--text-align-reverse', isRTL ? 'left' : 'right');
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'he', // Default to Hebrew
    lng: 'he', // Set Hebrew as primary language
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Support for RTL languages
    react: {
      useSuspense: false,
    },
  });

// Set initial direction
updateDirection(i18n.language);

// Listen for language changes and update direction
i18n.on('languageChanged', updateDirection);

export default i18n;
