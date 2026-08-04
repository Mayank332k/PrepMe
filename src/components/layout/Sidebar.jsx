import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSettings } from '../../context/SettingsContext';

export const Sidebar = ({ user, activeTab = 'upload', onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('profile'); // 'profile' | 'system'
  const sidebarRef = React.useRef(null);

  const { 
    hintsEnabled, 
    setHintsEnabled, 
    hintsForVoice, 
    setHintsForVoice, 
    hintsForChat, 
    setHintsForChat 
  } = useSettings();

  // Close cards when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Handled directly via backdrop click
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'upload', icon: 'cloud_upload', label: 'Upload', alwaysActive: true },
    { id: 'history', icon: 'history', label: 'History', alwaysActive: true },
  ];

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  const getNextResetDate = () => {
    if (user?.nextLimitReset) {
      const rawDate = user.nextLimitReset;
      try {
        const dateObj = new Date(rawDate);
        if (!isNaN(dateObj.getTime())) {
           // Parse in user's local time so server's midnight doesn't shift days
           return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
      } catch (e) {}
      return rawDate; 
    }
    return '1st of next month'; // fallback
  };

  const handleOpenModal = () => {
    setActiveModalTab('profile');
    setShowProfileCard(true);
  };

  return (
    <>
      <aside 
        ref={sidebarRef}
        className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
      >
        <header className={styles.header}>
          <button 
            className={styles.sidebarToggleBtn} 
            onClick={toggleSidebar}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <span className="material-symbols-outlined">
              {isExpanded ? "menu_open" : "menu"}
            </span>
          </button>
          {isExpanded && (
            <div className={styles.logoBadge}>
              <span className={styles.logoText}>PrepMe</span>
            </div>
          )}
        </header>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate && onNavigate(item.id)}
              className={`${styles.navLink} ${activeTab === item.id ? styles.active : ''}`}
              title={item.label}
              style={{ cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {isExpanded && <span className={styles.linkLabel}>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userProfileWrapper}>
            <div 
              className={styles.userTrigger} 
              onClick={handleOpenModal}
            >
              <div className={styles.avatar}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="User" />
                ) : (
                  <span>{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              {isExpanded && (
                <div className={styles.userInfoMini}>
                  <span className={styles.userNameMini}>{user?.name || 'User'}</span>
                  <span className={styles.userEmailMini}>{user?.email || 'user@example.com'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Centered Profile Modal */}
      {showProfileCard && (
        <div className={styles.modalBackdrop} onClick={() => setShowProfileCard(false)}>
          <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowProfileCard(false)} title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className={styles.modalNavTabs}>
              <button 
                className={`${styles.modalTab} ${activeModalTab === 'profile' ? styles.activeTab : ''}`}
                onClick={() => setActiveModalTab('profile')}
              >
                Profile
              </button>
              <button 
                className={`${styles.modalTab} ${activeModalTab === 'system' ? styles.activeTab : ''}`}
                onClick={() => setActiveModalTab('system')}
              >
                System
              </button>
              <button 
                className={`${styles.modalTab} ${activeModalTab === 'developer' ? styles.activeTab : ''}`}
                onClick={() => setActiveModalTab('developer')}
              >
                Developer
              </button>
            </div>
            
            {activeModalTab === 'profile' && (
              <div className={styles.modalTabContent}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalAvatar}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt="User" />
                    ) : (
                      <span>{user?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <h3 className={styles.modalName}>{user?.name || 'User'}</h3>
                  <p className={styles.modalEmail}>{user?.email || 'user@example.com'}</p>
                  
                  <div className={`${styles.remainingTag} ${((user?.interviewLimit || 20) - (user?.interviewsUsed || 0)) <= 5 ? styles.danger : ''}`}>
                    {Math.max(0, (user?.interviewLimit || 20) - (user?.interviewsUsed || 0))} Interviews Remaining
                  </div>
                </div>

                <div className={styles.modalUsageSection}>
                  <div className={styles.usageHeader}>
                    <span className={styles.usageLabel}>Monthly Limit Usage</span>
                    <span className={`${styles.usageStats} ${user?.interviewsUsed >= user?.interviewLimit ? styles.limitReached : ''}`}>
                      {user?.interviewsUsed || 0} / {user?.interviewLimit || 20}
                    </span>
                  </div>
                  <div className={styles.progressContainer}>
                    {[...Array(4)].map((_, i) => {
                      const limit = user?.interviewLimit || 20;
                      const used = user?.interviewsUsed || 0;
                      const remaining = Math.max(0, limit - used);
                      const globalFillPercentage = limit > 0 ? (remaining / limit) * 100 : 0;
                      const blockStart = i * 25;
                      const blockEnd = (i + 1) * 25;
                      
                      let fillWidth = 0;
                      if (globalFillPercentage >= blockEnd) fillWidth = 100;
                      else if (globalFillPercentage > blockStart) {
                        fillWidth = ((globalFillPercentage - blockStart) / 25) * 100;
                      }
                      
                      const isWarning = remaining <= 5;
                      
                      return (
                        <div key={i} className={styles.chunk}>
                          <div 
                            className={`${styles.chunkFill} ${isWarning ? styles.warning : ''}`}
                            style={{ width: `${fillWidth}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.resetDate}>
                    Next limit reset: {getNextResetDate()}
                  </div>
                </div>
              </div>
            )}

            {activeModalTab === 'system' && (
              <div className={styles.modalTabContent}>
                <div className={styles.modalSettingsSection}>
                  <h4 className={styles.settingsSectionTitle}>Settings</h4>
                  <div className={styles.modalSettings}>
                    <div className={styles.settingItem}>
                      <div className={styles.settingText}>
                        <span className={styles.settingLabel}>Appearance</span>
                        <span className={styles.settingDesc}>Toggle dark and light mode</span>
                      </div>
                      <ThemeToggle />
                    </div>

                    <div className={styles.settingItem}>
                      <div className={styles.settingText}>
                        <span className={styles.settingLabel}>In-App Hints</span>
                        <span className={styles.settingDesc}>Get mock hints during your sessions</span>
                      </div>
                      <button 
                        type="button" 
                        className={`${styles.toggleSwitch} ${hintsEnabled ? styles.active : ''}`}
                        onClick={() => setHintsEnabled(!hintsEnabled)}
                      >
                        <div className={styles.toggleKnob} />
                      </button>
                    </div>

                    <div className={styles.subOptionsContainer}>
                      <div className={`${styles.settingItem} ${!hintsEnabled ? styles.disabled : ''}`}>
                        <div className={styles.settingText}>
                          <span className={styles.subSettingLabel}>Voice Hints</span>
                          <span className={styles.settingDesc}>Show hints in Voice Mode</span>
                        </div>
                        <button 
                          type="button" 
                          className={`${styles.toggleSwitch} ${hintsForVoice ? styles.active : ''}`}
                          onClick={() => hintsEnabled && setHintsForVoice(!hintsForVoice)}
                          disabled={!hintsEnabled}
                        >
                          <div className={styles.toggleKnob} />
                        </button>
                      </div>

                      <div className={`${styles.settingItem} ${!hintsEnabled ? styles.disabled : ''}`}>
                        <div className={styles.settingText}>
                          <span className={styles.subSettingLabel}>Chat Hints</span>
                          <span className={styles.settingDesc}>Show hints in Chat Mode</span>
                        </div>
                        <button 
                          type="button" 
                          className={`${styles.toggleSwitch} ${hintsForChat ? styles.active : ''}`}
                          onClick={() => hintsEnabled && setHintsForChat(!hintsForChat)}
                          disabled={!hintsEnabled}
                        >
                          <div className={styles.toggleKnob} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
                
                <div className={styles.modalActions}>
                  <button 
                    className={styles.logoutBtn} 
                    onClick={() => {
                      setShowProfileCard(false);
                      setShowLogoutConfirm(true);
                    }}
                  >
                    <div className={styles.btnContent}>
                      <span className={styles.btnText}>Logout</span>
                      <span className={styles.btnArrow}>
                        <span className="material-symbols-outlined">logout</span>
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeModalTab === 'developer' && (
              <div className={styles.modalTabContent}>
                <div className={styles.developerLinks}>
                  <a href="mailto:singhmayank4146@gmail.com" className={styles.devLink} target="_blank" rel="noopener noreferrer">
                    <div className={styles.devIconWrapper} style={{ color: '#EA4335' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                    </div>
                    <span className={styles.devLinkText}>singhmayank4146@gmail.com</span>
                  </a>

                  <a href="https://www.linkedin.com/in/mayank-singh-813b68373/" className={styles.devLink} target="_blank" rel="noopener noreferrer">
                    <div className={styles.devIconWrapper} style={{ color: '#0A66C2' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <span className={styles.devLinkText}>LinkedIn</span>
                  </a>

                  <a href="https://github.com/Mayank332k" className={styles.devLink} target="_blank" rel="noopener noreferrer">
                    <div className={styles.devIconWrapper} style={{ color: 'var(--text-primary)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <span className={styles.devLinkText}>GitHub: Mayank332k</span>
                  </a>

                  <a href="https://portfolio-mayank-gamma.vercel.app/" className={styles.devLink} target="_blank" rel="noopener noreferrer">
                    <div className={styles.devIconWrapper} style={{ color: '#10B981' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <span className={styles.devLinkText}>Portfolio</span>
                  </a>

                  <a href="https://www.instagram.com/_mayvnk.ug?igsh=ZTIwa3VjdDJkZTY4" className={styles.devLink} target="_blank" rel="noopener noreferrer">
                    <div className={styles.devIconWrapper}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                        <defs>
                          <linearGradient id="instagram-gradient" x1="2" y1="22" x2="22" y2="2">
                            <stop offset="0%" stopColor="#fdf497" />
                            <stop offset="5%" stopColor="#fdf497" />
                            <stop offset="45%" stopColor="#fd5949" />
                            <stop offset="60%" stopColor="#d6249f" />
                            <stop offset="90%" stopColor="#285AEB" />
                          </linearGradient>
                        </defs>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                    </div>
                    <span className={styles.devLinkText}>Instagram</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div 
          className={styles.confirmModalOverlay} 
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div className={styles.confirmModalContent} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmModalText}>
              Are you sure you want to log out?
            </p>
            <div className={styles.confirmModalActions}>
              <button 
                className={styles.confirmCancelBtn} 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmLogoutBtn} 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onNavigate && onNavigate('logout');
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


