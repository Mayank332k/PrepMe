import React, { useState, useEffect } from 'react';
import api from '../api';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './History.module.css';
import logo from '../assets/logo.png';

export const History = ({ user, onNavigate, onViewReport, sessionActive }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/interview/history');
        if (data.success) {
          setHistoryItems(data.history || []);
        } else {
          setError('Failed to fetch history.');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Unable to load history. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleCardClick = async (item) => {
    if (item.status === 'completed' && item.reportId) {
      // Typically we'd fetch the report here, or pass the ID to App.jsx to handle
      onViewReport(item.sessionId || item._id); // Prefer sessionId if available
    } else {
      // If incomplete, maybe navigate to upload as a fresh start, or show a message
      console.log('Session not completed or no report available.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="history" onNavigate={onNavigate} sessionActive={sessionActive} />
      <MobileNav user={user} activeTab="history" onNavigate={onNavigate} sessionActive={sessionActive} />

      <main className={styles.mainCanvas}>
        <header className={styles.topBar}>
          <div className={styles.logoBadge}>
            <img src={logo} alt="PrepMe Logo" className={styles.logoImg} />
          </div>

          <div className={styles.headerActions}>
            <button className={styles.newInterviewBtn} onClick={() => onNavigate('upload')}>
              <span className="material-symbols-outlined">add</span>
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
          <div className={styles.historyContainer}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Your Interview History</h1>
              <p className={styles.pageSubtitle}>Review past sessions and track your progress over time.</p>
            </div>

            {loading ? (
              <div className={styles.skeletonGrid}>
                {[1, 2, 3, 4, 5, 6].map((skel) => (
                  <div key={skel} className={styles.skeletonCard}>
                    <div className={styles.skeletonHeader}>
                      <div className={`${styles.skeletonLine} ${styles.skeletonBadge}`}></div>
                      <div className={`${styles.skeletonLine} ${styles.skeletonDate}`}></div>
                    </div>
                    <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`}></div>
                    <div className={`${styles.skeletonLine} ${styles.skeletonFooter}`}></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className={styles.emptyState}>
                <span className="material-symbols-outlined">error</span>
                <h3>Oops! Something went wrong.</h3>
                <p>{error}</p>
              </div>
            ) : historyItems.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-symbols-outlined">history_toggle_off</span>
                <h3>No interviews yet</h3>
                <p>You haven't completed any interviews. Start a new session to see your progress here.</p>
              </div>
            ) : (
              <div className={styles.historyGrid}>
                {historyItems.map((item) => {
                  const isCompleted = item.status === 'completed';
                  const date = new Date(item.createdAt);
                  const dateString = `${String(date.getDate()).padStart(2, '0')} ${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getFullYear()).slice(-2)}`;

                  return (
                    <div 
                      key={item._id} 
                      className={styles.historyCard}
                      onClick={() => handleCardClick(item)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={`${styles.statusBadge} ${styles[item.status] || ''}`}>
                          {item.status}
                        </span>
                        <span className={styles.dateText}>{dateString}</span>
                      </div>
                      
                      <div>
                        <h3 className={styles.jobTitle}>
                          {item.jobDescription || 'General SWE Interview'}
                        </h3>
                      </div>
                      
                      <div className={styles.cardFooter}>
                        <div className={styles.scoreWrapper}>
                          {isCompleted ? (
                            <>
                              <span className={styles.scoreLabel}>Score:</span>
                              <span className={styles.scoreValue}>
                                {item.score !== null && item.score !== undefined ? `${item.score}/100` : '--'}
                              </span>
                            </>
                          ) : (
                            <span className={styles.scoreLabel}>Not Scored</span>
                          )}
                        </div>
                        
                        {isCompleted && (
                          <div className={styles.viewAction}>
                            View Details <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
