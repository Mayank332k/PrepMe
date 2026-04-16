import React, { useState, useRef } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './Upload.module.css';
import logo from '../assets/logo.png';

export const Upload = ({ user, onAnalyze, onNavigate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="upload" onNavigate={onNavigate} />
      <MobileNav user={user} activeTab="upload" onNavigate={onNavigate} />

      <main className={styles.mainCanvas}>
        <header className={styles.topBar}>
          <div className={styles.logoSection}>
            <div className={styles.logoBadge}>
              <img src={logo} alt="Logo" className={styles.logoImg} />
            </div>
          </div>
          
          <div className={styles.profileSection}>
            <div className={styles.avatar}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" />
              ) : (
                <span className={styles.avatarPlaceholder}>{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
          </div>
        </header>

        <section className={styles.uploadSection}>
          <div className={styles.bgBlobs}>
            <div className={styles.blob1}></div>
            <div className={styles.blob2}></div>
          </div>

          <div className={styles.dropzoneWrapper}>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx"
            />
            
            <div 
              className={`${styles.dropzoneGlass} ${isDragging ? styles.dragging : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <div className={styles.docIcon}>
                <span className="material-symbols-outlined">
                  {isDragging ? 'upload_file' : selectedFile ? 'task' : 'description'}
                </span>
              </div>
              
              <h3 className={styles.dropTitle}>
                {isDragging ? 'Drop your resume now' : selectedFile ? selectedFile.name : 'Choose a file to analyze'}
              </h3>
              
              <p className={styles.dropDesc}>
                {isDragging ? 'Perfect, release to upload' : selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Drag and drop your file here, or click to browse'}
              </p>
              
              <button 
                className={styles.analyzeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedFile) {
                    onAnalyze(selectedFile);
                  } else {
                    triggerFileInput();
                  }
                }}
              >
                {selectedFile ? 'Start Analysis' : 'Analyze Resume'}
              </button>

              <div className={styles.badges}>
                <div className={styles.badgeItem}>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>ATS Optimized</span>
                </div>
                <div className={styles.badgeItem}>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Privacy Secured</span>
                </div>
              </div>

              {isDragging && <div className={styles.dragOverlay}></div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Upload;
