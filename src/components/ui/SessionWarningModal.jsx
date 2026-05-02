import React from 'react';
import styles from './SessionWarningModal.module.css';

export const SessionWarningModal = ({ onContinue, onLeave }) => {
  return (
    <div className={styles.modalOverlay} onClick={onContinue}>
      <div className={styles.confirmCardMinimal} onClick={e => e.stopPropagation()}>
        <div className={styles.minimalHeader}>
          <h3 className={styles.minimalTitle}>Leave Interview?</h3>
          <p className={styles.minimalSubtext}>Progress in this session will not be saved.</p>
        </div>
        
        <div className={styles.minimalActions}>
          <button 
            className={styles.minimalCancelBtn}
            onClick={onContinue}
          >
            Continue
          </button>
          
          <button 
            className={styles.minimalLeaveBtn}
            onClick={onLeave}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
