import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const [actualTheme, setActualTheme] = useState('dark');

  useEffect(() => {
    const applyTheme = (pref) => {
      if (pref === 'device') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(isDarkMode ? 'dark' : 'light');
      } else {
        setActualTheme(pref);
      }
    };

    applyTheme(themePreference);

    if (themePreference === 'device') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => setActualTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themePreference]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', actualTheme);
    localStorage.setItem('theme', themePreference);
  }, [actualTheme, themePreference]);

  const toggleTheme = () => {
    setThemePreference(prev => (prev === 'dark' ? 'light' : prev === 'light' ? 'device' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ 
      theme: actualTheme, 
      themePreference, 
      setThemePreference, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
