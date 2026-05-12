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
        <span className={`material-symbols-outlined ${styles.icon} ${theme === 'dark' ? styles.visible : styles.hidden}`}>
          dark_mode
        </span>
        <span className={`material-symbols-outlined ${styles.icon} ${theme === 'light' ? styles.visible : styles.hidden}`}>
          light_mode
        </span>
      </div>
    </button>
  );
};
