import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './Report.module.css';
import logo from '../assets/logo.png';

// No mock data - strictly data-driven
// Custom Hook to animate counting numbers smoothly
const useCountUp = (end, duration = 1500, delay = 0) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      if (progress < delay) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const activeProgress = progress - delay;
      const percentage = Math.min(activeProgress / duration, 1);
      
      // Easing function for smoother deceleration
      const easeOut = 1 - Math.pow(1 - percentage, 4);
      
      setCount(Math.floor(end * easeOut));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, delay]);

  return count;
};

const CircularScore = ({ score }) => {
  const [offset, setOffset] = useState(2 * Math.PI * 60);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const displayNumber = useCountUp(score, 1800, 300); // 1.8s duration, 300ms delay

  useEffect(() => {
    // Animate stroke after a brief delay
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className={styles.circularScoreWrapper}>
      <svg className={styles.scoreSvg} width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="var(--border)" strokeWidth="8" fill="none" />
        <circle 
          cx="80" cy="80" r={radius} 
          stroke="url(#purpleGlow)" strokeWidth="8" fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={styles.scoreCircleAnim}
        />
        <defs>
          <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B0A3D5" />
            <stop offset="100%" stopColor="#584395" />
          </linearGradient>
        </defs>
      </svg>
      <div className={styles.scoreText}>
        <span className={styles.scoreNumber}>{displayNumber}</span>
        <span className={styles.scoreLabel}>Score</span>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, score, color, delay }) => {
  const [width, setWidth] = useState(0);
  const displayNumber = useCountUp(score, 1200, 400 + delay); // counts up after specified delay

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(score);
    }, 400 + delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className={styles.metricItem}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricScore} style={{ color }}>{displayNumber}%</span>
      </div>
      <div className={styles.track}>
        <div 
          className={styles.fill} 
          style={{ width: `${width}%`, backgroundColor: color }}
        >
          <div className={styles.fillGlow} style={{ backgroundColor: color }}></div>
        </div>
      </div>
    </div>
  );
};

export const Report = ({ user, sessionData, sessionActive, onRetake, onNavigate }) => {
  const reportData = sessionData?.report;
  
  if (!reportData) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
        <MobileNav user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
        <main className={styles.mainCanvas} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px' }}>analytics</span>
            <h2>Generating Report...</h2>
            <p>Please wait while we crunch the numbers, or return to history if this session is incomplete.</p>
          </div>
        </main>
      </div>
    );
  }

  const displayData = {
    overallScore: reportData.overallScore || 0,
    metrics: [
      { label: "Technical Depth", score: reportData.metrics?.technicalDepth || 0, color: "var(--color-green)" },
      { label: "Communication", score: reportData.metrics?.communication || 0, color: "var(--color-blue)" },
      { label: "Problem Solving", score: reportData.metrics?.problemSolving || 0, color: "var(--color-yellow)" },
      { label: "Confidence", score: reportData.metrics?.confidence || 0, color: "var(--color-purple)" },
    ],
    strengths: reportData.strengths || [],
    weaknesses: reportData.growth || reportData.weaknesses || [], // Added fallback for backend naming mismatch
    topicsToImprove: reportData.suggestedTopics || []
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
      <MobileNav user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />

      <main className={styles.mainCanvas}>
        <header className={styles.topBar}>
          <div className={styles.logoSection}>
            <div className={styles.logoBadge}>
              <img src={logo} alt="Logo" className={styles.logoImg} />
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.retakeBtn} onClick={onRetake}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
              New Interview
            </button>
            <div className={styles.profileSection}>
              <div className={styles.avatar}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" />
                ) : (
                  <span className={styles.avatarPlaceholder}>{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className={styles.scrollArea}>
          <div className={styles.reportContainer}>
            
            {/* Header Area */}
            <div className={styles.reportHeader}>
              <h2 className={styles.pageTitle}>Interview Analysis</h2>
              <p className={styles.pageSubtitle}>Session finalized on {(() => {
                const d = new Date();
                return `${String(d.getDate()).padStart(2, '0')} ${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getFullYear()).slice(-2)}`;
              })()}</p>
            </div>

            {/* Core Score Card & Metrics Merged */}
            <div className={styles.heroGrid}>
              <div className={`${styles.glassCard} ${styles.scoreCard}`}>
                <div className={styles.scoreSection}>
                  <CircularScore score={displayData.overallScore} />
                </div>
                
                <div className={styles.metricsListWrapper}>
                  {displayData.metrics.map((m, idx) => (
                    <ProgressBar 
                      key={idx} 
                      label={m.label} 
                      score={m.score} 
                      color={m.color} 
                      delay={idx * 150} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Breakdown Grid: Strengths, Weaknesses, Topics */}
            <div className={styles.breakdownGrid}>
              
              <div className={`${styles.glassCard} ${styles.detailColumn}`}>
                <div className={styles.detailHeader}>
                  <div className={styles.iconBox} style={{ color: 'var(--color-green)', backgroundColor: 'rgba(46, 213, 115, 0.1)' }}>
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <h3>Key Strengths</h3>
                </div>
                <ul className={styles.detailList}>
                  {displayData.strengths.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-green)', fontSize: '16px' }}>arrow_right</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`${styles.glassCard} ${styles.detailColumn}`}>
                <div className={styles.detailHeader}>
                  <div className={styles.iconBox} style={{ color: 'var(--color-yellow)', backgroundColor: 'rgba(255, 165, 2, 0.1)' }}>
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <h3>Areas for Growth</h3>
                </div>
                <ul className={styles.detailList}>
                  {displayData.weaknesses.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-yellow)', fontSize: '16px' }}>arrow_right</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`${styles.glassCard} ${styles.detailColumn} ${styles.topicsColumn}`}>
                <div className={styles.detailHeader}>
                  <div className={styles.iconBox} style={{ color: 'var(--color-blue)', backgroundColor: 'rgba(30, 144, 255, 0.1)' }}>
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <h3>Suggested Topics</h3>
                </div>
                <div className={styles.topicsList}>
                  {displayData.topicsToImprove.map((item, idx) => (
                    <div key={idx} className={styles.topicTag}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
