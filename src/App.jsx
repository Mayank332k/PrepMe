import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import api from './api';
import { Login } from './pages/Login';
import { Upload } from './pages/Upload';
import { Analyzing } from './pages/Analyzing';
import { Chat } from './pages/Chat';
import { Report } from './pages/Report';
import { History } from './pages/History';
import { SessionWarningModal } from './components/ui/SessionWarningModal';
import './index.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [resumeStatus, setResumeStatus] = useState(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState(null);

  // for prevent crash
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "739328229230-dummy.apps.googleusercontent.com";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          
          // Check for active session persistence
          const activeSessionId = localStorage.getItem('activeSessionId');
          if (activeSessionId) {
            setSessionData({ sessionId: activeSessionId });
            setCurrentScreen('chat');
          } else {
            setCurrentScreen('upload');
          }
        }
      } catch (err) {
        console.warn("User not authenticated");
        setCurrentScreen('login');
      } finally {
        setIsInitializing(false);
      }
    };
    checkAuth();
  }, []);

  const navigateTo = (screen, force = false) => {
    if (screen === 'logout') {
      api.get('/auth/logout').catch(() => {});
      localStorage.removeItem('token');
      localStorage.removeItem('activeSessionId');
      setUser(null);
      setResumeFile(null);
      setSessionData(null);
      setCurrentScreen('login');
      return;
    }

    // Block navigation if interview session is active and user is on chat screen
    if (!force && currentScreen === 'chat' && sessionData && screen !== 'chat') {
      setPendingNavTarget(screen);
      setShowSessionWarning(true);
      return;
    }

    setCurrentScreen(screen);
  };

  const handleSessionWarningContinue = () => {
    setShowSessionWarning(false);
    setPendingNavTarget(null);
  };

  const handleSessionWarningLeave = () => {
    setShowSessionWarning(false);
    // Clear the session data since user chose to leave
    localStorage.removeItem('activeSessionId');
    setSessionData(null);
    setResumeFile(null);
    // Navigate to the pending target
    setCurrentScreen(pendingNavTarget || 'upload');
    setPendingNavTarget(null);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentScreen('upload');
  };

  const handleViewReport = (sessionId) => {
    // Navigate immediately, Report component will handle the fetch
    setSessionData({ sessionId, report: null });
    setCurrentScreen('report');
  };

  const AppLoadingScreen = () => (
    <div className="global-loader-screen">
      <div className="global-loader-content">
        <div className="big-robo-avatar">
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="8" width="16" height="12" rx="3" strokeDasharray="2 2" />
            <path d="M8 4v4" />
            <path d="M16 4v4" />
            <circle cx="9" cy="14" r="1.5" fill="currentColor" className="robo-eye" />
            <circle cx="15" cy="14" r="1.5" fill="currentColor" className="robo-eye" />
            <path d="M10 18h4" strokeDasharray="1 2" />
          </svg>
        </div>
        <div className="dash-loader">
          <div className="dash-line"></div>
          <div className="dash-line"></div>
          <div className="dash-line"></div>
          <div className="dash-line"></div>
          <div className="dash-line"></div>
        </div>
      </div>
    </div>
  );

  if (isInitializing) {
    return <AppLoadingScreen />;
  }

  const renderComponent = () => {
    const sessionActive = !!sessionData;
    
    switch(currentScreen) {
      case 'upload': 
        return <Upload 
          user={user} 
          sessionActive={sessionActive}
          resumeStatus={resumeStatus}
          setResumeStatus={setResumeStatus}
          onAnalyze={(file, jd) => {
            setResumeFile(file);
            setJobDescription(jd);
            setCurrentScreen('analyzing');
          }} 
          onNavigate={navigateTo} 
        />;
      case 'analyzing': 
        return <Analyzing 
          resumeFile={resumeFile}
          jobDescription={jobDescription}
          onComplete={(data) => {
            if (data.sessionId) {
              localStorage.setItem('activeSessionId', data.sessionId);
            }
            // Update user state with new usage data
            if (data.interviewsUsed !== undefined) {
              setUser(prev => ({
                ...prev,
                interviewsUsed: data.interviewsUsed,
                interviewLimit: data.interviewLimit
              }));
            }
            setSessionData(data);
            setCurrentScreen('chat');
          }} 
        />;
      case 'chat': 
        return <Chat 
          user={user} 
          sessionData={sessionData} 
          sessionActive={sessionActive}
          onEndSession={async (sessionId) => {
            // Updated to support real report fetching
            try {
              const { data } = await api.post(`/interview/report/${sessionData.sessionId}`);
              if (data.success && data.report) {
                localStorage.removeItem('activeSessionId');
                setSessionData({ ...sessionData, report: data.report, transcript: data.transcript });
                setCurrentScreen('report');
              }
            } catch (err) {
              console.error("Failed to generate report. Error Details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
              });
              throw err;
            }
          }} 
          onNavigate={navigateTo} 
        />;
      case 'report': 
        return <Report 
          user={user} 
          sessionData={sessionData}
          setSessionData={setSessionData}
          sessionActive={sessionActive}
          onNavigate={navigateTo} 
        />;
      case 'history':
        return <History 
          user={user}
          onNavigate={navigateTo}
          onViewReport={handleViewReport}
          sessionActive={sessionActive}
        />;
      default: 
        return <Login onNavigate={navigateTo} onAuthSuccess={handleAuthSuccess} />;
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="App">
         {renderComponent()}
         {showSessionWarning && (
           <SessionWarningModal
             onContinue={handleSessionWarningContinue}
             onLeave={handleSessionWarningLeave}
           />
         )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
