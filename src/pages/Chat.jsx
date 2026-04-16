import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './Chat.module.css';
import logo from '../assets/logo.png';

export const Chat = ({ user, sessionData, onEndSession, onNavigate }) => {
  const [messages, setMessages] = useState([]);

  // Initialize with results from Analysis
  useEffect(() => {
    if (sessionData?.firstMessage && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          text: sessionData.firstMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [sessionData, messages.length]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endError, setEndError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    const sessionId = sessionData?.sessionId;

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const { data } = await api.post(`/interview/chat/${sessionId}`, { message: userText });
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error("Chat sync failed:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="chat" onNavigate={onNavigate} />

      <main className={styles.mainCanvas}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onEndSession}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div className={styles.centerBadge}>
            <span className={styles.sessionBadge}>Round 1</span>
          </div>
          
          <button 
            className={`${styles.endBtn} ${isEnding ? styles.endingActive : ''}`} 
            onClick={() => setShowEndConfirm(true)}
            disabled={isEnding}
          >
            {isEnding ? <div className={styles.miniSpinner}></div> : "End Session"}
          </button>
        </header>

        {/* Custom Confirmation Modal */}
        {showEndConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmCard}>
              <div className={styles.confirmIcon}>
                <span className="material-symbols-outlined">exit_to_app</span>
              </div>
              <h3>End Interview Session?</h3>
              <p>We will analyze your performance and generate a detailed report based on your responses.</p>
              
              {endError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>{endError}</p>}
              
              <div className={styles.confirmActions}>
                <button 
                  className={styles.cancelLink}
                  onClick={() => setShowEndConfirm(false)}
                  disabled={isEnding}
                >
                  Continue Interview
                </button>
                <button 
                  className={styles.confirmBtn}
                  onClick={async () => {
                    setIsEnding(true);
                    setEndError(null);
                    try {
                      await onEndSession();
                    } catch (err) {
                      setEndError("Failed to generate report. Please try again.");
                    } finally {
                      setIsEnding(false);
                    }
                  }}
                  disabled={isEnding}
                >
                  {isEnding ? "Processing..." : "Yes, End & Analyze"}
                </button>
              </div>
            </div>
          </div>
        )}

        <section className={styles.chatCanvas}>
          <div className={styles.messageScroll}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userRow : styles.aiRow}`}>
                <div className={styles.avatar}>
                  {msg.sender === 'ai' ? (
                    <img src={logo} alt="AI" className={styles.aiLogo} />
                  ) : (
                    user?.avatar ? (
                      <img src={user.avatar} alt="User" className={styles.userAvatarImg} />
                    ) : (
                      <span className="material-symbols-outlined">person</span>
                    )
                  )}
                </div>
                <div className={styles.messageBody}>
                  <div className={styles.bubble}>
                    {msg.text}
                  </div>
                  <span className={styles.time}>{msg.timestamp}</span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className={`${styles.messageRow} ${styles.aiRow}`}>
                <div className={styles.avatar}>
                  <img src={logo} alt="AI" className={styles.aiLogo} />
                </div>
                <div className={styles.messageBody}>
                  <div className={styles.skeletonContainer}>
                    <div className={styles.skeletonLine}></div>
                    <div className={styles.skeletonLine}></div>
                    <div className={styles.skeletonLine}></div>
                    <div className={`${styles.skeletonLine} ${styles.short}`}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} style={{ height: '100px', flexShrink: 0 }} />
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.inputWrapper}>
            <form onSubmit={handleSendMessage} className={styles.form}>
              <input 
                type="text" 
                placeholder="Reply to Prep AI..." 
                className={styles.input}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className={styles.sendIcon} disabled={!inputText.trim()}>
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </form>
          </div>
          <p className={styles.aiWarning}>AI can make mistakes. Please verify important info.</p>
        </footer>
      </main>
    </div>
  );
};

export default Chat;
