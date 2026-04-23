import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import api from './api';
import { Login } from './pages/Login';
import { Upload } from './pages/Upload';
import { Analyzing } from './pages/Analyzing';
import { Chat } from './pages/Chat';
import { Report } from './pages/Report';
import { History } from './pages/History';
import './index.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  // for prevent crash
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "739328229230-dummy.apps.googleusercontent.com";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setCurrentScreen('upload'); // Go to upload if logged in
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
      setUser(null);
      setResumeFile(null);
      setSessionData(null);
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(screen);
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
          onAnalyze={(file) => {
            setResumeFile(file);
            setCurrentScreen('analyzing');
          }} 
          onNavigate={navigateTo} 
        />;
      case 'analyzing': 
        return <Analyzing 
          resumeFile={resumeFile}
          onComplete={(data) => {
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
                setSessionData({ ...sessionData, report: data.report });
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
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
