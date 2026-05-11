import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './History.module.css';
import logo from '../assets/logo.png';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const History = ({ user, onNavigate, onViewReport, sessionActive }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'ongoing'
  const [chartRange, setChartRange] = useState('all'); // '7d', '1m', 'all'
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState({ show: false, type: null, id: null });
  const menuRef = useRef(null);
  const headerMenuRef = useRef(null);
  const filterRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterDropdownOpen(false);
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

  const getChartData = () => {
    const completedItems = historyItems
      .filter(item => item.status === 'completed' && item.score != null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (completedItems.length === 0) return [];

    let data = completedItems.map(item => ({
      date: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: item.score
    }));

    // Apply range filters
    if (chartRange === '7d') {
      data = data.slice(-7);
    } else if (chartRange === '1m') {
      data = data.slice(-30);
    }

    return data;
  };

  const chartData = getChartData();

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="history" onNavigate={onNavigate} sessionActive={sessionActive} />
      <MobileNav user={user} activeTab="history" onNavigate={onNavigate} sessionActive={sessionActive} />

      <main className={styles.mainCanvas}>
        <header className={styles.topBar}>
          <div className={styles.topLeftSection}>
            <h1 className={styles.compactTitle}>History</h1>
          </div>

          <div className={styles.headerActions}>
            {historyItems.length > 0 && (
              <div className={styles.headerMenuWrapper} ref={headerMenuRef}>
                <button 
                  className={styles.headerMenuBtn} 
                  onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                >
                  <span className="material-symbols-outlined">more_vert</span>
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
        </header>

        <section className={styles.scrollArea}>
          <div className={styles.historyContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.headerTitleRow}>
                <div className={styles.desktopHeaderInfo}>
                  <h1 className={styles.pageTitle}>Your Interview History</h1>
                  <p className={styles.pageSubtitle}>Review past sessions and track your progress over time.</p>
                </div>
                  
                {historyItems.length > 0 && (
                  <div className={styles.filterWrapper} ref={filterRef}>
                    <button 
                      className={styles.filterDropdownBtn}
                      onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt</span>
                      {statusFilter === 'all' ? 'All Sessions' : 
                        statusFilter === 'completed' ? 'Completed' : 'Ongoing'}
                      <span className={`material-symbols-outlined ${styles.chevron} ${filterDropdownOpen ? styles.open : ''}`}>
                        expand_more
                      </span>
                    </button>
                    
                    {filterDropdownOpen && (
                      <div className={styles.filterMenu}>
                        <button 
                          className={`${styles.filterOption} ${statusFilter === 'all' ? styles.activeOption : ''}`}
                          onClick={() => { setStatusFilter('all'); setFilterDropdownOpen(false); }}
                        >
                          All Sessions
                        </button>
                        <button 
                          className={`${styles.filterOption} ${statusFilter === 'completed' ? styles.activeOption : ''}`}
                          onClick={() => { setStatusFilter('completed'); setFilterDropdownOpen(false); }}
                        >
                          <span className={styles.dot} style={{ background: '#22c55e' }}></span>
                          Completed
                        </button>
                        <button 
                          className={`${styles.filterOption} ${statusFilter === 'ongoing' ? styles.activeOption : ''}`}
                          onClick={() => { setStatusFilter('ongoing'); setFilterDropdownOpen(false); }}
                        >
                          <span className={styles.dot} style={{ background: '#3b82f6' }}></span>
                          Ongoing
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CHART SKELETON */}
            {loading && (
              <div className={styles.chartSkeleton}>
                <div className={styles.chartSkeletonHeader}>
                  <div className={`${styles.skeletonLine}`} style={{ width: '35%', height: '22px', borderRadius: '8px' }}></div>
                  <div className={`${styles.skeletonLine}`} style={{ width: '45%', height: '32px', borderRadius: '100px' }}></div>
                </div>
                <div className={styles.chartSkeletonBody}></div>
              </div>
            )}

            {/* CHART SECTION */}
            {!loading && !error && historyItems.length > 0 && chartData.length > 0 && (
              <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Performance Trend</h3>
                  <div className={styles.chartTabs}>
                    <div 
                      className={styles.activeIndicator} 
                      style={{ 
                        transform: `translateX(${chartRange === '7d' ? '0%' : chartRange === '1m' ? '100%' : '200%'})`
                      }} 
                    />
                    <button 
                      className={`${styles.chartTab} ${chartRange === '7d' ? styles.activeTab : ''}`}
                      onClick={() => setChartRange('7d')}
                    >
                      <span className="material-symbols-outlined">calendar_view_week</span>
                      7d
                    </button>
                    <button 
                      className={`${styles.chartTab} ${chartRange === '1m' ? styles.activeTab : ''}`}
                      onClick={() => setChartRange('1m')}
                    >
                      <span className="material-symbols-outlined">calendar_month</span>
                      1m
                    </button>
                    <button 
                      className={`${styles.chartTab} ${chartRange === 'all' ? styles.activeTab : ''}`}
                      onClick={() => setChartRange('all')}
                    >
                      <span className="material-symbols-outlined">all_inclusive</span>
                      All
                    </button>
                  </div>
                </div>
                <div className={styles.chartContainer}>
                  {chartData.length < 2 ? (
                    <div className={styles.emptyChartState}>
                      <span className="material-symbols-outlined">analytics</span>
                      <p>Not enough data to show performance trend yet.</p>
                      <span>Complete a few more sessions to see your progress!</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={isMobile ? 180 : 280} minWidth={0}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5a9e3f" stopOpacity={0.15}/>
                            <stop offset="100%" stopColor="#5a9e3f" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eaeaea" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: '#8f8f8f' }} 
                          dy={10} 
                          minTickGap={20}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: '#8f8f8f' }} 
                          dx={-10} 
                          width={40}
                          domain={[0, 100]} 
                          allowDecimals={false}
                          tickCount={6}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                          itemStyle={{ color: '#5a9e3f', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#5a9e3f" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                          activeDot={{ r: 6, fill: '#5a9e3f', stroke: '#fff', strokeWidth: 2 }}
                          animationDuration={1000}
                          animationEasing="ease-in-out"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

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
                {historyItems
                  .filter(item => statusFilter === 'all' || item.status === statusFilter)
                  .map((item) => {
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
                                    <span className="material-symbols-outlined">more_vert</span>
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


