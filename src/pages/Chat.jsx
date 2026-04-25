import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputText]);

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
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    // If user presses Enter without Shift or Command modifiers, send message
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
    // New line is handled by the textarea naturally when Shift or Command modifiers are present
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
            <div className={styles.confirmCard} style={endError ? { padding: '40px', maxWidth: '380px' } : {}}>
              {endError ? (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto', display: 'block' }}>
                      <rect x="20" y="20" width="80" height="80" rx="20" fill="var(--bg-hover)" />
                      <rect x="35" y="35" width="50" height="18" rx="6" fill="var(--text-secondary)" opacity="0.2"/>
                      <rect x="35" y="65" width="50" height="18" rx="6" fill="var(--text-secondary)" opacity="0.2"/>
                      <circle cx="75" cy="44" r="3" fill="#ff3b30">
                        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="75" cy="74" r="3" fill="#ff3b30">
                        <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <path d="M60 45L80 80H40L60 45Z" fill="rgba(255, 255, 255, 0.9)" stroke="#ff3b30" stroke-width="3" stroke-linejoin="round"/>
                      <path d="M60 57V68M60 74V75" stroke="#ff3b30" stroke-width="4" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--text-primary)' }}>We're Sorry!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}>
                    Our AI servers are currently undergoing maintenance. Please try ending the session again in a few moments.
                  </p>
                  <div className={styles.confirmActions}>
                    <button 
                      className={styles.cancelLink}
                      onClick={() => setShowEndConfirm(false)}
                      disabled={isEnding}
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    >
                      Close
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
                      {isEnding ? "Processing..." : "Retry"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.confirmIcon}>
                    <span className="material-symbols-outlined">exit_to_app</span>
                  </div>
                  <h3>End Interview Session?</h3>
                  <p>We will analyze your performance and generate a detailed report based on your responses.</p>
                  
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
                </>
              )}
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
                    <div className={styles.markdownContent}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
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
              <textarea 
                ref={textareaRef}
                placeholder="Reply to Prep AI..." 
                className={styles.textarea}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
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
