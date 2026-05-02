import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './Report.module.css';
import logo from '../assets/logo.png';
import api from '../api';

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

export const Report = ({ user, sessionData, setSessionData, sessionActive, onRetake, onNavigate }) => {
  const [loading, setLoading] = useState(!sessionData?.report);
  const [error, setError] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState(sessionData?.transcript || []);
  const reportData = sessionData?.report;

  useEffect(() => {
    const fetchReport = async () => {
      if ((reportData && transcript && transcript.length > 0) || !sessionData?.sessionId) return;
      
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/interview/report/${sessionData.sessionId}`);
        if (data.success && data.report) {
          setSessionData({ ...sessionData, report: data.report, transcript: data.transcript });
          setTranscript(data.transcript || []);
        } else {
          setError("Report not found for this session.");
        }
      } catch (err) {
        setError("Failed to load report. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionData?.sessionId, reportData, setSessionData, sessionData]);
  
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
        <MobileNav user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
        <main className={styles.mainCanvas}>
          <header className={styles.topBar}>
             <div className={styles.logoSection}>
               <button className={styles.backBtn} onClick={() => onNavigate('history')}>
                 <div className={styles.backBtnContent}>
                   <div className={styles.customArrow}>
                     <div className={styles.arrowHead}></div>
                     <div className={styles.arrowShaft}></div>
                   </div>
                   <span className={styles.backBtnText}>Back</span>
                 </div>
               </button>

             </div>
          </header>
          <section className={styles.scrollArea}>
            <div className={styles.reportContainer}>
              {/* Header Skeleton */}
              <div className={styles.reportHeader}>
                <div className={styles.skeleton + ' ' + styles.skeletonTitle}></div>
                <div className={styles.pageSubtitle}>
                  <div className={styles.skeleton} style={{ height: '14px', width: '100px' }}></div>
                  <div className={styles.skeleton + ' ' + styles.datePill} style={{ width: '120px', height: '26px', border: 'none' }}></div>
                </div>
              </div>

              {/* Hero Grid Skeleton */}
              <div className={styles.heroGrid}>
                <div className={`${styles.glassCard} ${styles.scoreCard}`}>
                  <div className={styles.scoreSection}>
                    <div className={styles.skeleton + ' ' + styles.skeletonScore}></div>
                  </div>
                  <div className={styles.metricsListWrapper}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={styles.metricItem}>
                        <div className={styles.skeleton} style={{ height: '14px', width: '120px', marginBottom: '8px' }}></div>
                        <div className={styles.skeleton + ' ' + styles.skeletonMetricLine}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Breakdown Grid Skeleton */}
              <div className={styles.breakdownGrid}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={`${styles.glassCard} ${styles.detailColumn}`}>
                    <div className={styles.detailHeader}>
                      <div className={styles.skeleton} style={{ width: '36px', height: '36px', borderRadius: '10px' }}></div>
                      <div className={styles.skeleton} style={{ height: '18px', width: '100px' }}></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className={styles.skeleton} style={{ height: '14px', width: '100%' }}></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
        <MobileNav user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
        <main className={styles.mainCanvas} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <button className={styles.retryBtn} onClick={() => onNavigate('history')}>Back to History</button>
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
    weaknesses: reportData.areasForGrowth || reportData.growth || reportData.weaknesses || [], 
    topicsToImprove: reportData.suggestedTopics || []
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />
      <MobileNav user={user} activeTab="report" onNavigate={onNavigate} sessionActive={sessionActive} />

      <main className={styles.mainCanvas}>
        <header className={styles.topBar}>
          <div className={styles.logoSection}>
            <button className={styles.backBtn} onClick={() => onNavigate('history')}>
              <div className={styles.backBtnContent}>
                <div className={styles.customArrow}>
                  <div className={styles.arrowHead}></div>
                  <div className={styles.arrowShaft}></div>
                </div>
                <span className={styles.backBtnText}>Back</span>
              </div>
            </button>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.viewTranscriptBtn} 
              onClick={() => setShowTranscript(true)}
            >
              <div className={styles.btnContent}>
                <span className={styles.btnText}>View Chat</span>
                <span className={styles.btnArrow}>
                  <span className="material-symbols-outlined">forum</span>
                </span>
              </div>
            </button>
          </div>
        </header>

        <section className={styles.scrollArea}>
          <div className={styles.reportContainer}>
            
            {/* Header Area */}
            <div className={styles.reportHeader}>
              <h2 className={styles.pageTitle}>Interview Analysis</h2>
              <div className={styles.pageSubtitle}>
                <span>Session finalized:</span>
                <div className={styles.datePill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                  {(() => {
                    const d = sessionData?.updatedAt ? new Date(sessionData.updatedAt) : new Date();
                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  })()}
                </div>
              </div>
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
      {/* Transcript Drawer Overlay */}
      {showTranscript && (
        <div className={styles.drawerOverlay} onClick={() => setShowTranscript(false)}>
          <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitleGroup}>
                <span className="material-symbols-outlined">history_edu</span>
                <h3>Interview Transcript</h3>
              </div>
              <button className={styles.closeDrawer} onClick={() => setShowTranscript(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className={styles.drawerBody}>
              <div className={styles.transcriptScroll}>
                {transcript.length > 0 ? (
                  transcript.map((msg, idx) => (
                    <div key={idx} className={`${styles.msgRow} ${msg.role === 'user' ? styles.userRow : styles.aiRow}`}>
                      <div className={styles.msgBubble}>
                        <div className={styles.msgLabel}>{msg.role === 'user' ? 'You' : 'AI Interviewer'}</div>
                        <div className={styles.msgText}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyTranscript}>
                    <span className="material-symbols-outlined">sentiment_dissatisfied</span>
                    <p>No transcript available for this session.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.drawerFooter}>
              <p>This is a read-only view of your interview session.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
