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
        <button className={styles.newAnalysisBtn} onClick={() => onNavigate && onNavigate('upload')}>
          <span className="material-symbols-outlined">add</span>
          {isExpanded && <span>New Analysis</span>}
        </button>

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
              
              <div className={styles.cardActions}>
                <button 
                  className={styles.logoutBtn} 
                  onClick={() => onNavigate && onNavigate('logout')}
                >
                  <span className="material-symbols-outlined">logout</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
