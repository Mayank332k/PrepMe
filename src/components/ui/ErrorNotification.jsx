import React, { useEffect, useState } from 'react';
import { UserWarning02Icon, Bug02Icon } from 'hugeicons-react';
import styles from './ErrorNotification.module.css';

export const ErrorNotification = ({ 
  message, 
  title,
  type = 'error',
  icon, 
  visible, 
  autoDismissDuration = null, 
  onDismiss 
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      // Small delay to ensure DOM is updated before applying transition class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 1200); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && autoDismissDuration && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissDuration, onDismiss]);

  if (!isRendered) return null;

  const displayTitle = title || (type === 'warning' ? 'Warning' : 'Error');
  const IconComponent = type === 'warning' ? UserWarning02Icon : Bug02Icon;

  return (
    <div className={styles.wrapper}>
      <div 
        className={`${styles.notification} ${isVisible ? styles.visible : ''} ${type === 'warning' ? styles.typeWarning : styles.typeError}`}
        style={{ 
          WebkitBackdropFilter: 'blur(20px) saturate(180%)', 
          backdropFilter: 'blur(20px) saturate(180%)',
          willChange: 'transform, backdrop-filter'
        }}
      >
        <div className={styles.iconContainer}>
          {icon || <IconComponent size={24} variant="stroke" />}
        </div>
        
        <div className={styles.contentContainer}>
          <div className={styles.header}>
            <span className={styles.title}>{displayTitle}</span>
          </div>
          <span className={styles.message}>{message}</span>
        </div>
      </div>
    </div>
  );
};
