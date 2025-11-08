import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Get initial language from localStorage or default to 'en'
  const getInitialLanguage = () => {
    const storedLang = localStorage.getItem('language');
    return storedLang || 'en';
  };

  const [currentLang, setCurrentLang] = useState(getInitialLanguage);
  const [dir, setDir] = useState(currentLang === 'ar' ? 'rtl' : 'ltr');

  // Update direction when language changes
  useEffect(() => {
    const newDir = currentLang === 'ar' ? 'rtl' : 'ltr';
    setDir(newDir);
    // Update document direction
    document.documentElement.dir = newDir;
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Change language function
  const changeLanguage = (lang) => {
    if (lang === 'en' || lang === 'ar') {
      setCurrentLang(lang);
      localStorage.setItem('language', lang);
      
      // Update i18next language if available
      if (window.i18next) {
        window.i18next.changeLanguage(lang);
      }
    }
  };

  const value = {
    currentLang,
    dir,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

