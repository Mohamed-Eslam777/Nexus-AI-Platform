import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './en.json';
import arTranslations from './ar.json';

// Configure i18next
i18n
  // Detect user language from browser or localStorage
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'ar'],
    
    // Resources (translations)
    resources: {
      en: {
        translation: enTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },

    // Detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],
      
      // Keys to lookup language from
      lookupLocalStorage: 'language',
      
      // Cache user language
      caches: ['localStorage'],
    },

    // React i18next options
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Debug mode (set to false in production)
    debug: false,
  });

// Make i18next globally available for LanguageContext
if (typeof window !== 'undefined') {
  window.i18next = i18n;
}

export default i18n;

