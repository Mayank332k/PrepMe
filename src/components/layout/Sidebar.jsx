import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import logo from '../../assets/logo.png';

export const Sidebar = ({ user, activeTab = 'upload', onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const sidebarRef = React.useRef(null);

  // Close profile card when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowProfileCard(false);
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

  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);
  const toggleSidebar = () => setIsExpanded(!isExpanded);

  return (
    <aside 
      ref={sidebarRef}
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <header className={styles.header}>
        <div className={styles.logoBadge} onClick={toggleSidebar}>
          <img src={logo} alt="Logo" className={styles.logoImg} />
        </div>
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
            onClick={() => setShowProfileCard(!showProfileCard)}
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
        </div>
      </div>
    </aside>
  );
};
