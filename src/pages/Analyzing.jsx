import React, { useEffect } from 'react';
import api from '../api';
import styles from './Analyzing.module.css';

export const Analyzing = ({ resumeFile, onComplete }) => {
  const [error, setError] = React.useState(null);

  useEffect(() => {
    const handleAnalysis = async () => {
      const startTime = Date.now();
      try {
        let response;
        if (resumeFile) {
          // New Resume Upload (Update)
          const formData = new FormData();
          formData.append('resume', resumeFile);
          response = await api.post('/interview/ingest', formData);
        } else {
          // Use Saved Resume
          response = await api.post('/interview/ingest', {});
        }
        
        const { data } = response;
        
        // Always wait for the premium animation to feel "high-end"
        const elapsed = Date.now() - startTime;
        if (elapsed < 5000) {
          await new Promise(r => setTimeout(r, 5000 - elapsed));
        }
        
        onComplete(data);
      } catch (err) {
        console.error("Analysis Error:", err);
        setError(err.response?.data?.message || "Failed to parse resume. Check your connection.");
      }
    };
    handleAnalysis();
  }, [resumeFile, onComplete]);


  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.glowBackdrop}></div>
        <div className={styles.content}>
          <div className={styles.errorBox}>
            <div className={styles.maintenanceSvg}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Plate */}
                <rect x="20" y="20" width="80" height="80" rx="20" fill="var(--bg-hover)" />
                
                {/* Server Racks */}
                <rect x="35" y="35" width="50" height="18" rx="6" fill="var(--text-secondary)" opacity="0.2"/>
                <rect x="35" y="65" width="50" height="18" rx="6" fill="var(--text-secondary)" opacity="0.2"/>
                
                {/* Blinking Red Lights */}
                <circle cx="75" cy="44" r="3" fill="#ff3b30">
                  <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle cx="75" cy="74" r="3" fill="#ff3b30">
                  <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                </circle>

                {/* Exclamation Triangle */}
                <path d="M60 45L80 80H40L60 45Z" fill="rgba(255, 255, 255, 0.9)" stroke="#ff3b30" stroke-width="3" stroke-linejoin="round"/>
                <path d="M60 57V68M60 74V75" stroke="#ff3b30" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </div>
            <h3>We're Sorry!</h3>
            <p>Our AI servers are currently undergoing maintenance or experiencing high load. Please try again in a few moments.</p>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>Retry Connection</button>
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
