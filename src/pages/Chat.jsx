import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../api';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './Chat.module.css';
import logo from '../assets/logo.png';

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeHeader}>
        <div className={styles.codeLang}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>code</span>
          {language || 'code'}
        </div>
        <button className={styles.copyBtn} onClick={copyToClipboard} title="Copy code">
          {copied ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="12" height="12" rx="3.5" ry="3.5"></rect>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" opacity="0.5"></path>
            </svg>
          )}
        </button>
      </div>
      <div className={styles.codeContent}>
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneLight}
          PreTag="div"
          codeTagProps={{ style: { backgroundColor: 'transparent' } }}
          customStyle={{
            margin: 0,
            padding: '16px 20px',
            backgroundColor: 'transparent',
            fontSize: '14.5px',
            lineHeight: '1.6',
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <CodeBlock 
        language={match[1]} 
        value={String(children).replace(/\n$/, '')} 
      />
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

const ChatMessage = React.memo(({ msg, activeMenuId, setActiveMenuId, sessionData }) => {
  return (
    <div className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userRow : styles.aiRow}`}>
      <div className={styles.messageBody}>
        <div className={styles.bubbleContainer}>
          <div className={styles.bubble}>
            <div className={styles.markdownContent}>
              <ReactMarkdown components={MarkdownComponents}>{msg.text}</ReactMarkdown>
            </div>
          </div>
        </div>

        {msg.sender === 'ai' && (
          <div className={styles.messageMetadata}>
            <button 
              className={styles.menuTrigger} 
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
              }}
            >
              <span className="material-symbols-outlined">more_horiz</span>
            </button>

            {activeMenuId === msg.id && (
              <div className={styles.infoDropdown} onClick={(e) => e.stopPropagation()}>
                <span className={styles.infoLabel}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {msg.timestamp}
                </span>
                
                <div className={styles.infoItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#666' }}>fingerprint</span>
                  <span className={styles.infoValue}>Session #{sessionData?.sessionId?.slice(-6).toUpperCase() || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endError, setEndError] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Hint States
  const [showHintNudge, setShowHintNudge] = useState(false);
  const [showHintBox, setShowHintBox] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintText, setHintText] = useState('');
  const [hintCancelCount, setHintCancelCount] = useState(0); 
  const lastActionTime = useRef(Date.now());
  const hintTimerRef = useRef(null);

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
    scrollRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping || isStreaming) return;

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/interview/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userText }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      let lastUpdateTime = 0;
      let scrollAnimationFrame;

      setIsTyping(false); 
      setIsStreaming(true); 

      // Initialize empty AI message
      const aiMsgId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      const smoothScroll = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'auto' });
        }
        if (isStreaming) {
          scrollAnimationFrame = requestAnimationFrame(smoothScroll);
        }
      };

      // Start the smooth scroll loop
      scrollAnimationFrame = requestAnimationFrame(smoothScroll);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                accumulatedResponse += parsed.content;
                
                // Increased throttle to 80ms for smoother code rendering
                const now = Date.now();
                if (now - lastUpdateTime > 80) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex]?.sender === 'ai') {
                      newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        text: accumulatedResponse
                      };
                    }
                    return newMessages;
                  });
                  lastUpdateTime = now;
                }
              }
            } catch (err) {
              // Partial chunk skip
            }
          }
        }
      }

      // Cleanup scroll animation
      cancelAnimationFrame(scrollAnimationFrame);

      // Final update to ensure everything is rendered
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          text: accumulatedResponse
        };
        return newMessages;
      });
    } catch (err) {
      setIsTyping(false);
    } finally {
      setIsStreaming(false);
    }
  };

  // Timer for Hint Nudge (20s inactivity)
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const diff = now - lastActionTime.current;
      
      // Dynamic Delay: 20s -> 40s -> 60s
      let threshold = 20000;
      if (hintCancelCount === 1) threshold = 40000;
      else if (hintCancelCount >= 2) threshold = 60000;

      if (diff >= threshold && !inputText.trim() && !showHintBox && !isStreaming && !showHintNudge && messages.length > 0) {
        setShowHintNudge(true);
      }
    };

    const interval = setInterval(checkInactivity, 5000);
    return () => clearInterval(interval);
  }, [inputText, showHintBox, isStreaming, showHintNudge, messages.length, hintCancelCount]);

  const handleKeyDown = (e) => {
    // Reset timer on any key press
    lastActionTime.current = Date.now();
    if (showHintNudge) setShowHintNudge(false);

    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const requestHint = async () => {
    setShowHintNudge(false);
    setShowHintBox(true);
    setIsHintLoading(true);
    setHintText('');

    try {
      const token = localStorage.getItem('token');
      const sessionId = sessionData?.sessionId;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/interview/hint/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messageHistory: [] })
      });

      const data = await response.json();
      if (data.success) {
        setHintText(data.hint);
      } else {
        setHintText("I'm sorry, I couldn't generate a hint right now.");
      }
    } catch (err) {
      console.error('Hint Fetch Error:', err);
      setHintText("Failed to connect to the hint service.");
    } finally {
      setIsHintLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="chat" onNavigate={onNavigate} />

      <main className={styles.mainCanvas}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => {
            if (messages.length > 1) setShowEndConfirm(true);
            else onNavigate('history');
          }}>
            <div className={styles.backBtnContent}>
              <div className={styles.customArrow}>
                <div className={styles.arrowHead}></div>
                <div className={styles.arrowShaft}></div>
              </div>
              <span className={styles.backBtnText}>Back</span>
            </div>
          </button>
          
          <div></div> {/* Spacer for grid symmetry */}
          
          <button 
            className={`${styles.endBtn} ${isEnding ? styles.endingActive : ''}`} 
            onClick={() => setShowEndConfirm(true)}
            disabled={isEnding}
          >
            <div className={styles.endBtnContent}>
              <span className={styles.endBtnText}>
                {isEnding ? <div className={styles.miniSpinner}></div> : "End Session"}
              </span>
              <div className={styles.customArrowForward}>
                <div className={styles.arrowShaft}></div>
                <div className={styles.arrowHeadForward}></div>
              </div>
            </div>
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
                      <div className={styles.btnContent}>
                        <span className={styles.btnText}>Close</span>
                        <span className={styles.btnArrow}>
                          <span className="material-symbols-outlined">close</span>
                        </span>
                      </div>
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
                      <div className={styles.endBtnContent}>
                        <div className={styles.customArrow}>
                          <div className={styles.arrowHead}></div>
                          <div className={styles.arrowShaft}></div>
                        </div>
                        <span className={styles.backBtnText}>Continue</span>
                      </div>
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
                      <div className={styles.endBtnContent}>
                        <span className={styles.endBtnText} style={{ width: '110px' }}>
                          {isEnding ? <div className={styles.miniSpinner}></div> : "End & Analyze"}
                        </span>
                        <div className={styles.customArrowForward}>
                          <div className={styles.arrowShaft}></div>
                          <div className={styles.arrowHeadForward}></div>
                        </div>
                      </div>
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
              <ChatMessage 
                key={msg.id} 
                msg={msg} 
                activeMenuId={activeMenuId} 
                setActiveMenuId={setActiveMenuId} 
                sessionData={sessionData} 
              />
            ))}
            
            {isTyping && (
              <div className={`${styles.messageRow} ${styles.aiRow}`}>
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
          {/* Unified Morphing Hint Container */}
          {(showHintNudge || showHintBox) && (
            <div className={`${styles.hintContainer} ${showHintBox ? styles.hintExpanded : styles.hintPill}`}>
              {!showHintBox ? (
                <div className={styles.hintPillContent}>
                  <button className={styles.nudgeBtn} onClick={requestHint}>
                    <span className="material-symbols-outlined">lightbulb</span>
                    Hints
                  </button>
                  <button className={styles.nudgeClose} onClick={() => {
                    setShowHintNudge(false);
                    setHintCancelCount(prev => prev + 1); // Increase delay for next time
                    lastActionTime.current = Date.now(); // Reset timer
                  }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <div className={styles.hintExpandedContent}>
                  <div className={styles.hintHeader}>
                    <div className={styles.hintTitle}>
                      <span className="material-symbols-outlined">lightbulb</span>
                      AI Hint
                    </div>
                    <div className={styles.hintActions}>
                      <button 
                        className={styles.hintRegen} 
                        onClick={requestHint}
                        disabled={isHintLoading}
                        title="Regenerate Hint"
                      >
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                      <button className={styles.hintClose} onClick={() => setShowHintBox(false)}>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>
                  <div className={styles.hintBody}>
                    {isHintLoading ? (
                      <div className={styles.hintSkeleton}>
                        <div className={styles.hintSkeletonLine}></div>
                        <div className={styles.hintSkeletonLine} style={{ width: '80%' }}></div>
                      </div>
                    ) : (
                      <ReactMarkdown>{hintText}</ReactMarkdown>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
                <div className={styles.sendIconContent}>
                  <span className="material-symbols-outlined">arrow_upward</span>
                  <span className="material-symbols-outlined" id={styles.sendIconSecond}>arrow_upward</span>
                </div>
              </button>
            </form>
          </div>
          <p className={styles.aiWarning}>AI can make mistakes</p>
        </footer>
      </main>
    </div>
  );
};

export default Chat;
