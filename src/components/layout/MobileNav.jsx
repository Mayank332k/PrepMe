import React, { useState } from 'react';
import styles from './MobileNav.module.css';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';

export const MobileNav = ({ user, activeTab = 'upload', onNavigate, isLoading = false }) => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showSettingsCard, setShowSettingsCard] = useState(false);
  const { 
    hintsEnabled, 
    setHintsEnabled, 
    hintsForVoice, 
    setHintsForVoice, 
    hintsForChat, 
    setHintsForChat 
  } = useSettings();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'upload', icon: 'cloud_upload', label: 'Upload' },
    { id: 'history', icon: 'history', label: 'History' },
  ];

  const activeIndex = navItems.findIndex(item => item.id === activeTab);

  return (
    <>
      <div className={styles.mobileNavWrapper}>
        <nav className={`${styles.mainNavPill} ${showProfileCard || showSettingsCard ? styles.navPillHidden : ''}`}>
          <div 
            className={styles.activeBackgroundPill}
            style={{
              '--active-index': activeIndex !== -1 ? activeIndex : 0,
              opacity: activeIndex === -1 || showProfileCard || showSettingsCard ? 0 : 1
            }}
          />
          {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setShowProfileCard(false);
              setShowSettingsCard(false);
              onNavigate && onNavigate(item.id);
            }}
            className={`${styles.navItem} ${activeTab === item.id && !showProfileCard && !showSettingsCard ? styles.active : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <span className={`material-symbols-outlined ${(activeTab === item.id && isLoading) ? styles.skeletonIcon : ''}`}>
              {item.icon}
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </div>
        ))}
        </nav>
        
        <div className={`${styles.profilePill} ${showProfileCard || showSettingsCard ? styles.profilePillExpanded : ''}`}>
          {/* Collapsed state: avatar + label */}
          {!showProfileCard && !showSettingsCard && (
            <div 
              className={`${styles.profileItem} ${showProfileCard ? styles.active : ''}`}
              onClick={() => {
                setShowProfileCard(true);
                setShowSettingsCard(false);
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
                    const remaining = limit - used;
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

                <div className={styles.settingItem}>
                  <div className={styles.settingText}>
                    <span className={styles.settingLabel}>Dark Mode</span>
                    <span className={styles.settingDesc}>Switch between Dark and Light mode</span>
                  </div>
                  <button 
                    type="button" 
                    className={`${styles.toggleSwitch} ${theme === 'dark' ? styles.active : ''}`}
                    onClick={toggleTheme}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop overlay for click-to-close */}
      {(showProfileCard || showSettingsCard) && (
        <div 
          className={styles.morphedBackdrop} 
          onClick={() => { setShowProfileCard(false); setShowSettingsCard(false); }} 
        />
      )}
    </>
  );
};
