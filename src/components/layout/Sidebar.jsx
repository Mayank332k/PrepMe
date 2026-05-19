import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSettings } from '../../context/SettingsContext';

export const Sidebar = ({ user, activeTab = 'upload', onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('prepme_sidebar_expanded');
    return saved === 'true';
  });
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showSettingsCard, setShowSettingsCard] = useState(false);
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
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowProfileCard(false);
        setShowSettingsCard(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user info from props
  const userData = user || {};

  const navItems = [
    { id: 'upload', icon: 'cloud_upload', label: 'Upload', alwaysActive: true },
    { id: 'history', icon: 'history', label: 'History', alwaysActive: true },
  ];

  const toggleSidebar = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem('prepme_sidebar_expanded', String(next));
      return next;
    });
  };

  return (
    <aside 
      ref={sidebarRef}
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
    >
      <header className={styles.header}>
        {isExpanded ? (
          <div className={styles.logoContainer}>
            <span className={styles.logoText}>PrepMe</span>
            <button 
              type="button" 
              className={styles.toggleBtn} 
              onClick={toggleSidebar}
              aria-label="Collapse Sidebar"
              title="Collapse Sidebar"
            >
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          </div>
        ) : (
          <div className={styles.collapsedHeader}>
            <button 
              type="button" 
              className={styles.toggleBtn} 
              onClick={toggleSidebar}
              aria-label="Expand Sidebar"
              title="Expand Sidebar"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
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
        <div className={styles.sidebarActions}>
          <ThemeToggle className={styles.sidebarThemeBtn} />
          {isExpanded && <span className={styles.linkLabel}>Switch Theme</span>}
        </div>

        <div 
          className={styles.sidebarActions} 
          onClick={() => { setShowSettingsCard(!showSettingsCard); setShowProfileCard(false); }}
          title="App Settings"
        >
          <button className={styles.sidebarSettingsBtn} type="button">
            <span className="material-symbols-outlined">settings</span>
          </button>
          {isExpanded && <span className={styles.linkLabel}>Settings</span>}
        </div>

        <div className={styles.userProfileWrapper}>
          <div 
            className={styles.userTrigger} 
            onClick={() => { setShowProfileCard(!showProfileCard); setShowSettingsCard(false); }}
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

          {showProfileCard && (
            <div className={styles.profileCard}>
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
                    const remaining = limit - used;
                    // Calculate how much of this specific 5-interview chunk is remaining
                    const chunkRemaining = Math.max(0, Math.min(5, remaining - (i * 5)));
                    const fillWidth = (chunkRemaining / 5) * 100;
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

          {showSettingsCard && (
            <div className={styles.settingsCard}>
              <div className={styles.settingsCardHeader}>
                <span className="material-symbols-outlined">settings</span>
                <h3>App Settings</h3>
              </div>

              <div className={styles.settingsBody}>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
