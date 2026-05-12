import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../api';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './Chat.module.css';

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
          style={oneDark}
          useInlineStyles={false}
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

const languageAliases = {
  js: 'javascript',
  node: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  cplusplus: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  yml: 'yaml',
};

const getCodeLanguage = (className = '') => {
  const languageClass = className
    .split(/\s+/)
    .find((name) => name.startsWith('language-'));

  if (!languageClass) return '';

  const language = languageClass.replace('language-', '').toLowerCase();
  return languageAliases[language] || language;
};

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const language = getCodeLanguage(className);
    return !inline && language ? (
      <CodeBlock 
        language={language} 
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
              <ReactMarkdown components={MarkdownComponents}>
                {msg.text.replace(/\n(?!\n)/g, '  \n')}
              </ReactMarkdown>
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
                  {(() => {
                    const msgDate = msg.date || new Date();
                    const today = new Date();
                    const isToday = msgDate.getDate() === today.getDate() && 
                                   msgDate.getMonth() === today.getMonth() && 
                                   msgDate.getFullYear() === today.getFullYear();
                    
                    return isToday ? 'Today' : msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  })()}, {msg.timestamp}
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

  // Initialize with results from Analysis or Restore Session
  useEffect(() => {
    const restoreSession = async () => {
      const sessionId = sessionData?.sessionId;
      if (!sessionId || messages.length > 0) return;

      setIsInitialLoading(true);
      try {
        const { data } = await api.get(`/interview/session/${sessionId}`);
        
        // Handle completed session by redirecting back
        if (data.success && data.message === "Interview completed successfully!") {
          localStorage.removeItem('activeSessionId');
          onNavigate('upload');
          return;
        }

        if (data.success && data.session.transcript.length > 0) {
          const formattedMessages = data.session.transcript.map((m, idx) => ({
            id: m._id || `msg-${idx}-${Date.now()}`, // Truly unique ID for state management
            sender: m.role === 'assistant' ? 'ai' : 'user',
            text: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Earlier',
            date: m.timestamp ? new Date(m.timestamp) : new Date()
          }));
          setMessages(formattedMessages);
          
          // Only show pill if it's a refresh (no firstMessage in props) 
          // and we have actual history
          if (!sessionData?.firstMessage) {
            setIsResumed(true);
            setTimeout(() => {
              setIsExiting(true);
              setTimeout(() => {
                setIsResumed(false);
                setIsExiting(false);
              }, 600); // Animation duration
            }, 5000);
          }
        } else if (sessionData?.firstMessage) {
          setMessages([
            {
              id: Date.now(),
              sender: 'ai',
              text: sessionData.firstMessage,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    restoreSession();
  }, [sessionData, messages.length]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isResumed, setIsResumed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  
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
  const chatCanvasRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show button if user scrolls up by more than 300px from bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 300;
    setShowScrollBtn(!isAtBottom);
  };

  // Auto-resize textarea with refined smooth transition
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 1. Save current height
      const startHeight = textarea.style.height;
      
      // 2. Measure new height
      textarea.style.height = 'auto';
      const targetHeight = `${Math.min(textarea.scrollHeight, 150)}px`;
      
      // 3. Restore start height immediately
      textarea.style.height = startHeight;
      
      // 4. In the next frame, apply target height to trigger transition
      requestAnimationFrame(() => {
        textarea.style.height = targetHeight;
      });
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

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping || isStreaming) return;

    const userText = inputText.trim();
    const sessionId = sessionData?.sessionId;

    const newUserMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date()
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
      let lineBuffer = ''; // Buffer for partial SSE lines

      setIsTyping(false); 
      setIsStreaming(true); 

      // Initialize empty AI message
      const aiMsgId = `ai-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date()
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;
        
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop(); // Keep the last (potentially partial) line

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const dataStr = trimmedLine.substring(6).trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) {
              accumulatedResponse += parsed.content;
              
              // Force React state update
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex]?.sender === 'ai') {
                  newMessages[lastIndex] = { ...newMessages[lastIndex], text: accumulatedResponse };
                }
                return newMessages;
              });

              // YIELD TO MAIN THREAD: 15ms pause (approx 1 frame). 
              // This guarantees the UI paints each chunk/word individually, fixing the freeze bug and creating a smooth typewriter effect.
              await new Promise(resolve => setTimeout(resolve, 15));
            }
          } catch (err) {
            console.warn('Streaming parse error:', err, 'Line:', trimmedLine);
          }
        }
      }

      // Final update to ensure everything is rendered
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex]?.sender === 'ai') {
          newMessages[lastIndex] = { ...newMessages[lastIndex], text: accumulatedResponse };
        }
        return newMessages;
      });
      setIsStreaming(false);
      
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setIsTyping(false);
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

    // Send on Cmd+Enter or Ctrl+Enter, while plain Enter goes to next line
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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
          <button 
            className={styles.backBtn} 
            onClick={() => setShowBackConfirm(true)}
          >
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
            className={styles.endBtn} 
            onClick={() => setShowEndConfirm(true)}
            disabled={isTyping || isStreaming || isEnding}
          >
            {isEnding ? <div className={styles.dashedSpinner}></div> : "End Session"}
          </button>
        </header>

        {showBackConfirm && (
          <div className={styles.modalOverlay} onClick={() => setShowBackConfirm(false)}>
            <div className={styles.confirmCardMinimal} onClick={e => e.stopPropagation()}>
              <div className={styles.minimalHeader}>
                <h3 className={styles.minimalTitle}>Leave Interview?</h3>
                <p className={styles.minimalSubtext}>Progress in this session will not be saved.</p>
              </div>
              
              <div className={styles.minimalActions}>
                <button 
                  className={styles.minimalCancelBtn}
                  onClick={() => setShowBackConfirm(false)}
                >
                  Continue
                </button>
                
                <button 
                  className={styles.minimalLeaveBtn}
                  onClick={() => {
                    localStorage.removeItem('activeSessionId');
                    onNavigate('history', true);
                  }}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}
        {showEndConfirm && (
          <div className={styles.modalOverlay} onClick={() => !isEnding && setShowEndConfirm(false)}>
            <div className={styles.confirmCardMinimal} onClick={e => e.stopPropagation()}>
              <div className={styles.minimalHeader}>
                <h3 className={styles.minimalTitle}>End Session?</h3>
                <p className={styles.minimalSubtext}>this will eval the final result of this interview</p>
              </div>
              
              <div className={styles.minimalActions}>
                {!isEnding && (
                  <button 
                    className={styles.minimalCancelBtn}
                    onClick={() => setShowEndConfirm(false)}
                  >
                    Continue
                  </button>
                )}
                
                <button 
                  className={`${styles.minimalEndBtn} ${isEnding ? styles.centeredEnd : ''}`}
                  onClick={async () => {
                    setIsEnding(true);
                    try {
                      await onEndSession();
                    } catch (err) {
                      setIsEnding(false);
                    }
                  }}
                  disabled={isEnding}
                >
                  {isEnding ? (
                    <div className={styles.iosSpinner}>
                      {[...Array(8)].map((_, i) => <div key={i} className={styles.iosBar}></div>)}
                    </div>
                  ) : (
                    "End"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <section 
          className={styles.chatCanvas} 
          ref={chatCanvasRef}
          onScroll={handleScroll}
        >
          <div className={styles.messageScroll}>
            {isResumed && (
              <div className={`${styles.resumedPill} ${isExiting ? styles.pillExiting : ''}`}>
                <span className={`material-symbols-outlined ${styles.resumedIcon}`}>check_circle</span>
                <span className={styles.resumedText}>Session Resumed</span>
              </div>
            )}

            {isInitialLoading && messages.length === 0 ? (
              <div style={{ padding: '20px' }}>
                <div className={styles.skeletonContainer}>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonLine}></div>
                  <div className={`${styles.skeletonLine} ${styles.short}`}></div>
                </div>
              </div>
            ) : messages.map((msg) => (
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
                    <div className={`${styles.skeletonLine} ${styles.short}`}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} style={{ height: '20px', flexShrink: 0 }} />
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
                <div className={styles.sendIconContent}>
                  <span className="material-symbols-outlined">arrow_upward</span>
                  <span className="material-symbols-outlined" id={styles.sendIconSecond}>arrow_upward</span>
                </div>
              </button>
            </form>
          </div>
          <p className={styles.aiWarning}>AI can make mistakes</p>
        </footer>

        {/* Unified Morphing Hint Container - Moved outside footer to fix backdrop-filter issues */}
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
                  setHintCancelCount(prev => prev + 1); 
                  lastActionTime.current = Date.now();
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
        {showScrollBtn && (
          <button 
            className={styles.scrollDownBtn} 
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            <span className="material-symbols-outlined">arrow_downward</span>
          </button>
        )}
      </main>
    </div>
  );
};

export default Chat;
