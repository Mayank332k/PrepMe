import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import api from '../api';
import styles from './Upload.module.css';
import logo from '../assets/logo.png';

export const Upload = ({ user, resumeStatus, setResumeStatus, onAnalyze, onNavigate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(!resumeStatus);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (resumeStatus) {
      setLoading(false);
      return;
    }

    const checkResumeStatus = async () => {
      try {
        const { data } = await api.get('/interview/resume-status');
        setResumeStatus({
          hasResume: data.hasResume,
          resumeName: data.resumeName || ''
        });
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    checkResumeStatus();
  }, [resumeStatus, setResumeStatus]);

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

  const handleStartAnalysis = () => {
    if (selectedFile) {
      setIsUploading(true);
      const duration = 2000; // 2 seconds total for smooth fill
      const start = performance.now();
      
      const animate = (time) => {
        const elapsed = time - start;
        const progress = Math.min((elapsed / duration) * 100, 100);
        
        setUploadProgress(progress);
        
        if (progress < 100) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            onAnalyze(selectedFile, jobDescription);
          }, 400);
        }
      };
      
      requestAnimationFrame(animate);
    } else if (resumeStatus?.hasResume) {
      onAnalyze(null, jobDescription);
    } else {
      triggerFileInput();
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="upload" onNavigate={onNavigate} />
      <MobileNav user={user} activeTab="upload" onNavigate={onNavigate} />

      <main className={styles.mainCanvas}>
        <header className={styles.topBar}>
          <div className={styles.logoSection}>
            <img src={logo} alt="Logo" className={styles.logoImg} />
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
          <div className={styles.workspaceGrid}>
            {/* Resume Section */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className="material-symbols-outlined">description</span>
                <h3>Your Resume</h3>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx"
              />
              
              <div 
                className={`${styles.resumeArea} ${isUploading ? styles.uploading : ''}`}
                style={{ '--progress': `${uploadProgress}%` }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!isUploading ? triggerFileInput : undefined}
              >
                <div className={styles.resumeInfo}>
                  <div className={styles.fileIcon}>
                    <span className="material-symbols-outlined">
                      {selectedFile ? 'picture_as_pdf' : resumeStatus?.hasResume ? 'verified' : 'upload_file'}
                    </span>
                  </div>
                  <div>
                    <div className={styles.fileName}>
                      {selectedFile ? selectedFile.name : resumeStatus?.hasResume ? resumeStatus.resumeName : 'Select Resume (PDF)'}
                    </div>
                    <div className={styles.fileStatus}>
                      {isDragging ? 'Drop to upload' : selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : resumeStatus?.hasResume ? 'Saved in profile' : 'Drag & drop or click to browse'}
                    </div>
                  </div>
                </div>
                
                <button className={styles.changeBtn}>
                  {selectedFile || resumeStatus?.hasResume ? 'Change' : 'Browse'}
                </button>
              </div>
            </div>

            {/* JD Section */}
            <div className={styles.jdContainer}>
              <div className={styles.sectionHeader}>
                <span className="material-symbols-outlined">work</span>
                <h3>Target Job Description</h3>
              </div>
              
              <textarea 
                className={styles.jdTextarea}
                placeholder="Paste the Job Description here (Optional)..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Final Action */}
            <div className={styles.footerAction}>
              <button 
                className={styles.startBtn}
                onClick={handleStartAnalysis}
                disabled={loading || (!selectedFile && !resumeStatus?.hasResume)}
              >
                <span className={styles.btnText}>Start Interview</span>
                <div className={styles.divider}></div>
                <span className={styles.iconRight}>arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Upload;
