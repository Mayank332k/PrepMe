import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './History.module.css';
import logo from '../assets/logo.png';

export const History = ({ user, onNavigate, onViewReport, sessionActive }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null); // Track which card menu is open
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState({ show: false, type: null, id: null });
  const menuRef = useRef(null);
  const headerMenuRef = useRef(null);

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

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleCardClick = (item) => {
    if (activeMenu) return; // Don't navigate if menu is open
    if (item.status === 'completed' && item.reportId) {
      onViewReport(item.sessionId || item._id);
    } else {
      console.log('Session not completed or no report available.');
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleDeleteSingle = (e, sessionId) => {
    e.stopPropagation();
    setActiveMenu(null);
    setShowConfirm({ show: true, type: 'single', id: sessionId });
  };

  const handleClearAll = () => {
    setHeaderMenuOpen(false);
    setShowConfirm({ show: true, type: 'all', id: null });
  };

  const confirmAction = async () => {
    const { type, id } = showConfirm;
    setShowConfirm({ show: false, type: null, id: null });

    if (type === 'single') {
      const originalItems = [...historyItems];
      setHistoryItems(historyItems.filter(item => (item.sessionId || item._id) !== id));
      try {
        await api.delete(`/interview/history/${id}`);
      } catch (err) {
        console.error("Delete failed", err);
        setHistoryItems(originalItems);
      }
    } else if (type === 'all') {
      const originalItems = [...historyItems];
      setHistoryItems([]);
      try {
        await api.delete('/interview/history');
      } catch (err) {
        console.error("Clear history failed", err);
        setHistoryItems(originalItems);
      }
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
              <div className={styles.headerTitleRow}>
                <div>
                  <h1 className={styles.pageTitle}>Your Interview History</h1>
                  <p className={styles.pageSubtitle}>Review past sessions and track your progress over time.</p>
                </div>
                {historyItems.length > 0 && (
                  <div className={styles.headerMenuWrapper} ref={headerMenuRef}>
                    <button 
                      className={styles.headerMenuBtn} 
                      onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                    >
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                    {headerMenuOpen && (
                      <div className={styles.headerDropdown}>
                        <button onClick={handleClearAll} className={styles.deleteOption}>
                          <span className="material-symbols-outlined">delete_sweep</span>
                          Clear All History
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                  const dateString = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  const sid = item.sessionId || item._id;
                  const isMenuOpen = activeMenu === sid;
                  const isConfirming = showConfirm.show && showConfirm.type === 'single' && showConfirm.id === sid;

                  return (
                    <div 
                      key={item._id} 
                      className={`${styles.historyCard} ${isConfirming ? styles.confirming : ''}`}
                      onClick={() => !isConfirming && handleCardClick(item)}
                    >
                      {isConfirming ? (
                        <div className={styles.confirmState}>
                          <div className={styles.confirmContent}>
                            <span className="material-symbols-outlined">warning</span>
                            <div className={styles.confirmText}>
                              <h4>Delete this session?</h4>
                              <p>This action cannot be undone.</p>
                            </div>
                          </div>
                          <div className={styles.confirmActions}>
                            <button 
                              className={styles.cancelAction} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowConfirm({ show: false, type: null, id: null });
                              }}
                            >
                              Cancel
                            </button>
                            <button 
                              className={styles.deleteAction} 
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAction();
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.cardHeader}>
                            <span className={`${styles.statusBadge} ${styles[item.status] || ''}`}>
                              {item.status}
                            </span>
                            <div className={styles.headerRight}>
                              <span className={styles.dateText}>{dateString}</span>
                              <div className={styles.menuWrapper} ref={isMenuOpen ? menuRef : null}>
                                <button 
                                  className={styles.menuDots}
                                  onClick={(e) => toggleMenu(e, sid)}
                                >
                                  <span className="material-symbols-outlined">more_horiz</span>
                                </button>
                                
                                {isMenuOpen && (
                                  <div className={styles.dropdownMenu}>
                                    <button onClick={(e) => handleDeleteSingle(e, sid)} className={styles.deleteOption}>
                                      <span className="material-symbols-outlined">delete</span>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className={styles.jobTitle}>
                              {item.jobDescription 
                                ? (() => {
                                    const cleanTitle = item.jobDescription.replace(/\*/g, '').trim();
                                    return cleanTitle.length > 60 
                                      ? cleanTitle.substring(0, 60) + '...' 
                                      : cleanTitle;
                                  })()
                                : 'General SWE Interview'}
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
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {showConfirm.show && showConfirm.type === 'all' && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirm({ show: false, type: null, id: null })}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <h3>Clear all history?</h3>
            <p>This will permanently remove all your past sessions. This action is irreversible.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm({ show: false, type: null, id: null })}>
                Go Back
              </button>
              <button className={styles.confirmBtn} onClick={confirmAction}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


