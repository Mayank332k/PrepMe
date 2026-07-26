import React, { useState } from 'react';
import styles from './MobileNav.module.css';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';

export const MobileNav = ({ user, activeTab = 'upload', onNavigate, isLoading = false }) => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showSettingsCard, setShowSettingsCard] = useState(false);
  const [showDeveloperCard, setShowDeveloperCard] = useState(false);
  const { 
    hintsEnabled, 
    setHintsEnabled, 
    hintsForVoice, 
    setHintsForVoice, 
    hintsForChat, 
    setHintsForChat 
  } = useSettings();
  const { theme, themePreference, setThemePreference, toggleTheme } = useTheme();

  const navItems = [
    { id: 'upload', icon: 'cloud_upload', label: 'Upload' },
    { id: 'history', icon: 'history', label: 'History' },
  ];

  const activeIndex = navItems.findIndex(item => item.id === activeTab);

  return (
    <>
      <div className={styles.mobileNavWrapper}>
        <nav 
          className={`${styles.mainNavPill} ${showProfileCard || showSettingsCard || showDeveloperCard ? styles.navPillHidden : ''}`}
          style={{ WebkitBackdropFilter: 'blur(8px) saturate(180%)', backdropFilter: 'blur(8px) saturate(180%)', transform: 'translate3d(0, 0, 0)' }}
        >
          <div 
            className={styles.activeBackgroundPill}
            style={{
              '--active-index': activeIndex !== -1 ? activeIndex : 0,
              opacity: activeIndex === -1 || showProfileCard || showSettingsCard || showDeveloperCard ? 0 : 1
            }}
          />
          {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setShowProfileCard(false);
              setShowSettingsCard(false);
              setShowDeveloperCard(false);
              onNavigate && onNavigate(item.id);
            }}
            className={`${styles.navItem} ${activeTab === item.id && !showProfileCard && !showSettingsCard && !showDeveloperCard ? styles.active : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <span className={`material-symbols-outlined ${(activeTab === item.id && isLoading) ? styles.skeletonIcon : ''}`}>
              {item.icon}
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </div>
        ))}
        </nav>
        
        <div 
          className={`${styles.profilePill} ${showProfileCard || showSettingsCard || showDeveloperCard ? styles.profilePillExpanded : ''}`}
          style={{ 
            WebkitBackdropFilter: (showProfileCard || showSettingsCard || showDeveloperCard) ? 'none' : 'blur(24px) saturate(180%)', 
            backdropFilter: (showProfileCard || showSettingsCard || showDeveloperCard) ? 'none' : 'blur(24px) saturate(180%)', 
            transform: 'translate3d(0, 0, 0)' 
          }}
        >
          {/* Collapsed state: avatar + label */}
          {!showProfileCard && !showSettingsCard && !showDeveloperCard && (
            <div 
              className={`${styles.profileItem} ${showProfileCard ? styles.active : ''}`}
              onClick={() => {
                setShowProfileCard(true);
                setShowSettingsCard(false);
                setShowDeveloperCard(false);
              }}
            >
              <div className={styles.avatarMini}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="P" />
                ) : (
                  <span>{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <span className={styles.navLabel}>Me</span>
            </div>
          )}

          {/* Expanded: Profile Card Content */}
          {showProfileCard && (
            <div className={styles.morphedCardContent}>
              <button 
                type="button"
                className={styles.profileDeveloperTrigger}
                onClick={() => {
                  setShowProfileCard(false);
                  setShowDeveloperCard(true);
                }}
                title="Developer Info"
              >
                <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" style={{ opacity: 0.85 }}>
                  <path d="M200-520v-40q0-72 32.5-131.5T320-789l-75-75 35-36 85 85q26-12 55.5-18.5T480-840q30 0 59.5 6.5T595-815l85-85 35 36-75 75q55 38 87.5 97.5T760-560v40H200Zm428.5-91.5Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5Zm-240 0Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm-107 490Q200-203 200-320v-160h560v160q0 117-81.5 198.5T480-40q-117 0-198.5-81.5Z"/>
                </svg>
              </button>
              <button 
                type="button"
                className={styles.profileSettingsTrigger}
                onClick={() => {
                  setShowProfileCard(false);
                  setShowSettingsCard(true);
                }}
                title="Settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>

              <div className={styles.cardHeader}>
                <div className={styles.largeAvatar}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User" />
                  ) : (
                    <span>{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className={styles.cardDetails}>
                  <h3>{user?.name || 'User'}</h3>
                  <p>{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              
              <div className={styles.usageSection}>
                <div className={styles.usageHeader}>
                  <span className={styles.usageLabel}>Monthly Limit</span>
                  <span className={`${styles.usageStats} ${user?.interviewsUsed >= user?.interviewLimit ? styles.limitReached : ''}`}>
                    {user?.interviewsUsed || 0}/{user?.interviewLimit || 0}
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
                {user?.interviewsUsed >= user?.interviewLimit && (
                  <p className={styles.usageNote}>Monthly limit reached</p>
                )}
              </div>
              
              <div className={styles.cardActions}>
                <button 
                  className={styles.logoutBtn} 
                  onClick={() => onNavigate && onNavigate('logout')}
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

          {/* Expanded: Settings Card Content */}
          {showSettingsCard && (
            <div className={styles.morphedCardContent}>
              <div className={styles.settingsCardHeader}>
                <span className="material-symbols-outlined">settings</span>
                <h3>App Settings</h3>
              </div>

              <div className={styles.mobileSettingsContent}>
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

                <div className={`${styles.subOptionsContainer} ${hintsEnabled ? styles.visible : ''}`}>
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

                <div className={styles.themeToggleSection}>
                  <div className={styles.settingText}>
                    <span className={styles.settingLabel}>Theme</span>
                  </div>
                  <div className={styles.themeSegmentedControl} data-active={themePreference}>
                    <div className={styles.sliderTint} />
                    <button 
                      type="button"
                      className={`${styles.themeSegmentBtn} ${themePreference === 'dark' ? styles.active : ''}`}
                      onClick={() => setThemePreference('dark')}
                      aria-label="Dark Theme"
                      title="Dark Theme"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                      </svg>
                    </button>
                    <button 
                      type="button"
                      className={`${styles.themeSegmentBtn} ${themePreference === 'light' ? styles.active : ''}`}
                      onClick={() => setThemePreference('light')}
                      aria-label="Light Theme"
                      title="Light Theme"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                      </svg>
                    </button>
                    <button 
                      type="button"
                      className={`${styles.themeSegmentBtn} ${themePreference === 'device' ? styles.active : ''}`}
                      onClick={() => setThemePreference('device')}
                      aria-label="Device Theme"
                      title="Device Theme"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="3" rx="2"/>
                        <line x1="8" x2="16" y1="21" y2="21"/>
                        <line x1="12" x2="12" y1="17" y2="21"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expanded: Developer Card Content */}
          {showDeveloperCard && (
            <div className={styles.morphedCardContent}>
              <div className={styles.settingsCardHeader}>
                <svg width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" style={{ color: 'var(--text-secondary)' }}>
                  <path d="M200-520v-40q0-72 32.5-131.5T320-789l-75-75 35-36 85 85q26-12 55.5-18.5T480-840q30 0 59.5 6.5T595-815l85-85 35 36-75 75q55 38 87.5 97.5T760-560v40H200Zm428.5-91.5Q640-623 640-640t-11.5-28.5Q617-680 600-680t-28.5 11.5Q560-657 560-640t11.5 28.5Q583-600 600-600t28.5-11.5Zm-240 0Q400-623 400-640t-11.5-28.5Q377-680 360-680t-28.5 11.5Q320-657 320-640t11.5 28.5Q343-600 360-600t28.5-11.5Zm-107 490Q200-203 200-320v-160h560v160q0 117-81.5 198.5T480-40q-117 0-198.5-81.5Z"/>
                </svg>
                <h3>Developer</h3>
              </div>

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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop overlay for click-to-close */}
      {(showProfileCard || showSettingsCard || showDeveloperCard) && (
        <div 
          className={styles.morphedBackdrop} 
          onClick={() => { setShowProfileCard(false); setShowSettingsCard(false); setShowDeveloperCard(false); }} 
          style={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)', backdropFilter: 'blur(24px) saturate(180%)', transform: 'translate3d(0, 0, 0)' }}
        />
      )}
    </>
  );
};
