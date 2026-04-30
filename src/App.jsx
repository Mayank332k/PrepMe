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

  const navigateTo = (screen) => {
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
    if (currentScreen === 'chat' && sessionData && screen !== 'chat') {
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

  if (isInitializing) {
    return (
      <div className="skeleton-page-screen">
        <div className="skeleton-nav"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"></div>)}
          </div>
        </div>
      </div>
    );
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
          onRetake={() => {
            setResumeFile(null);
            setSessionData(null);
            setCurrentScreen('upload');
          }} 
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
