import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className={`${styles.themeBtn} ${className}`} 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className={styles.iconWrapper}>
        <svg 
          className={`${styles.icon} ${theme === 'dark' ? styles.visible : styles.hidden}`}
          width="21" height="21" viewBox="0 0 24 24" fill="currentColor" stroke="none"
        >
          <path d="M12.3 22A10 10 0 0 1 8.4 2.8a1 1 0 0 1 1.3 1.1 7.7 7.7 0 0 0 8.4 9.5 1 1 0 0 1 1.1 1.3 10 10 0 0 1-6.9 7.3z" />
        </svg>
        <svg 
          className={`${styles.icon} ${theme === 'light' ? styles.visible : styles.hidden}`}
          width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </div>
    </button>
  );
};
