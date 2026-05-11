import React, { useState } from 'react';
import styles from './MobileNav.module.css';

export const MobileNav = ({ user, activeTab = 'upload', onNavigate }) => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const navItems = [
    { id: 'upload', icon: 'cloud_upload', label: 'Upload' },
    { id: 'history', icon: 'history', label: 'History' },
  ];

  return (
    <>
      <nav className={styles.mobileNav}>
        {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavigate && onNavigate(item.id)}
            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </div>
        ))}
        
        <div 
          className={styles.profileItem}
          onClick={() => setShowProfileCard(!showProfileCard)}
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
      </nav>

      {showProfileCard && (
        <div className={styles.mobileOverlay} onClick={() => setShowProfileCard(false)}>
          <div className={styles.mobileProfileCard} onClick={e => e.stopPropagation()}>
            <div className={styles.cardIndicator}></div>
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
        </div>
      )}
    </>
  );
};
