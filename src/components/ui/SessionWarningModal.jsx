import React from 'react';
import styles from './SessionWarningModal.module.css';

export const SessionWarningModal = ({ onContinue, onLeave }) => {
  return (
    <div className={styles.overlay} onClick={onContinue}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <span className="material-symbols-outlined">warning</span>
        </div>
        <h3>Interview in Progress</h3>
        <p>
          You have an active interview session. Leaving now will 
          <strong> end your session </strong> 
          and all progress will be lost.
        </p>
        <div className={styles.actions}>
          <button className={styles.continueBtn} onClick={onContinue}>
            Continue Interview
          </button>
          <button className={styles.leaveBtn} onClick={onLeave}>
            Leave Session
          </button>
        </div>
      </div>
    </div>
  );
};
