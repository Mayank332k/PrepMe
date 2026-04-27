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
