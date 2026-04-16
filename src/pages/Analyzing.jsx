import React, { useEffect } from 'react';
import api from '../api';
import styles from './Analyzing.module.css';

export const Analyzing = ({ resumeFile, onComplete }) => {
  const [error, setError] = React.useState(null);

  useEffect(() => {
    // If no file, something went wrong in navigation flow
    if (!resumeFile) {
      console.warn("Analyzing mounted without resumeFile");
      return; 
    }

    const handleAnalysis = async () => {
      const startTime = Date.now();
      try {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        
        const { data } = await api.post('/interview/ingest', formData);
        
        // Always wait for the premium animation to feel "high-end"
        const elapsed = Date.now() - startTime;
        if (elapsed < 5000) {
          await new Promise(r => setTimeout(r, 5000 - elapsed));
        }
        
        onComplete(data);
      } catch (err) {
        console.error("Analysis Error:", err);
        setError(err.response?.data?.message || "Failed to parse resume. Check your connection.");
        // Don't auto-complete on error, show the error state or let user go back
      }
    };
    handleAnalysis();
  }, [resumeFile, onComplete]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <span className="material-symbols-outlined">error</span>
            <h3>Analysis Failed</h3>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const logicSteps = [
    "Extracting raw text logic...",
    "Parsing professional timeline...",
    "Understanding overall resume trajectory...",
    "Synthesizing core competencies...",
    "Calibrating AI interview scenario..."
  ];

  return (
    <div className={styles.container}>
      <div className={styles.glowBackdrop}></div>
      
      <div className={styles.content}>
        
        {/* Minimalist Scanning Document Component */}
        <div className={styles.documentCard}>
          <div className={`${styles.skeletonBlock} ${styles.titleLine}`}></div>
          
          <div className={styles.textGroup}>
            <div className={`${styles.skeletonBlock} ${styles.textLine}`}></div>
            <div className={`${styles.skeletonBlock} ${styles.textLine}`}></div>
            <div className={`${styles.skeletonBlock} ${styles.textLine} ${styles.short}`}></div>
          </div>

          <div className={styles.textGroup} style={{ marginTop: '8px' }}>
            <div className={`${styles.skeletonBlock} ${styles.textLine}`}></div>
            <div className={`${styles.skeletonBlock} ${styles.textLine} ${styles.shorter}`}></div>
          </div>

          {/* The elegant scanning laser overlay */}
          <div className={styles.documentScanner}></div>
        </div>

        <div className={styles.logsContainer}>
          {logicSteps.map((step, index) => (
            <div 
              key={index} 
              className={styles.logStep} 
              style={{ animationDelay: `${index * 0.9}s` }}
            >
              <div className={styles.logDot} style={{ animationDelay: `${index * 0.9}s` }}></div>
              <span className={styles.logText}>{step}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
