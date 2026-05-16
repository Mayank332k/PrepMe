import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../api';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import styles from './Chat.module.css';
import aiIcon from '../assets/image.png';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;
}

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

// Helper to clean markdown for Voice Mode
const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/__(.*?)__/g, '$1')     // Bold underscore
    .replace(/_(.*?)_/g, '$1')       // Italic underscore
    .replace(/`(.*?)`/g, '$1')       // Inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/#+\s/g, '')            // Headers
    .trim();
};

const ChatMessage = React.memo(({ msg, activeMenuId, setActiveMenuId, sessionData, activeVoiceMessageId, currentSpokenWordIndex }) => {
  const isSpeaking = activeVoiceMessageId === msg.id;
  const lyricContainerRef = useRef(null);
  
  // Memoize cleaned words to prevent re-splitting on every render
  const words = useMemo(() => {
    const cleanText = isSpeaking ? stripMarkdown(msg.text) : msg.text;
    return cleanText.split(/\s+/);
  }, [msg.text, isSpeaking]);

  // Adjust scroll position to keep active word centered
  useEffect(() => {
    if (isSpeaking && lyricContainerRef.current) {
      const activeWord = lyricContainerRef.current.querySelector(`.${styles.wordActive}`);
      const viewport = lyricContainerRef.current.closest(`.${styles.lyricViewport}`);
      
      if (activeWord && viewport) {
        const viewportHeight = viewport.offsetHeight;
        const wordOffset = activeWord.offsetTop;
        const wordHeight = activeWord.offsetHeight;
        
        // Calculate the translation needed to put the active word at the center of the viewport
        // Use translate3d for hardware acceleration and sub-pixel accuracy
        const targetScroll = wordOffset - (viewportHeight / 2) + (wordHeight / 2);
        lyricContainerRef.current.style.transform = `translate3d(0, ${-targetScroll}px, 0)`;
      }
    }
  }, [currentSpokenWordIndex, isSpeaking]);
  
  return (
    <div className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userRow : styles.aiRow}`}>
      <div className={styles.messageBody}>
        <div className={styles.bubbleContainer}>
          <div className={`${styles.bubble} ${isSpeaking ? styles.lyricBubble : ''}`}>
            <div className={styles.markdownContent}>
              {isSpeaking ? (
                <div className={styles.lyricViewport}>
                  <div className={styles.lyricText} ref={lyricContainerRef}>
                    {words.map((word, wIdx) => {
                      const isPast = wIdx < currentSpokenWordIndex;
                      const isActive = wIdx === currentSpokenWordIndex;
                      const isFuture = wIdx > currentSpokenWordIndex;
                      
                      return (
                        <span 
                          key={wIdx} 
                          className={`${styles.lyricWord} ${
                            isActive ? styles.wordActive : 
                            isPast ? styles.wordPast : styles.wordFuture
                          }`}
                        >
                          {word.split('').map((char, cIdx) => (
                            <span 
                              key={cIdx} 
                              className={styles.lyricChar}
                              style={{ transitionDelay: isActive ? `${cIdx * 0.06}s` : '0s' }}
                            >
                              {char}
                            </span>
                          ))}
                          <span className={styles.lyricChar}>&nbsp;</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <ReactMarkdown components={MarkdownComponents}>
                  {msg.text.replace(/\n(?!\n)/g, '  \n')}
                </ReactMarkdown>
              )}
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
            id: m._id || `msg-${idx}-${Date.now()}`,
            sender: m.role === 'assistant' ? 'ai' : 'user',
            text: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Earlier',
            date: m.timestamp ? new Date(m.timestamp) : new Date()
          }));
          setMessages(formattedMessages);
          
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
  const recognitionRef = useRef(null);

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeVoiceMessageId, setActiveVoiceMessageId] = useState(null);
  const [currentSpokenWordIndex, setCurrentSpokenWordIndex] = useState(-1);
  const isDictatingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isVoiceModeRef = useRef(false);
  const sendMessageRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const [voiceWave, setVoiceWave] = useState(false);
  const recognitionBaseTextRef = useRef('');
  const inputTextRef = useRef(inputText);
  const speechQueueRef = useRef([]);
  const isSpeakingChunkRef = useRef(false);
  const totalWordsSpokenRef = useRef(0);

  // Sync inputTextRef with state
  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

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

  // Sync refs with state
  useEffect(() => {
    isDictatingRef.current = isDictating;
    isListeningRef.current = isListening;
    isVoiceModeRef.current = isVoiceMode;
    sendMessageRef.current = handleSendMessage;
  }); // Run on every render to ensure sendMessageRef always has the latest closure/state

  // Dictation Effect
  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      recognitionBaseTextRef.current = inputTextRef.current;
    };

    recognition.onresult = (event) => {
      let currentSessionFinal = '';
      let currentSessionInterim = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentSessionFinal += event.results[i][0].transcript;
        } else {
          currentSessionInterim += event.results[i][0].transcript;
        }
      }

      if (isDictatingRef.current || isListeningRef.current) {
        const base = recognitionBaseTextRef.current;
        const newText = base + (base && !base.endsWith(' ') ? ' ' : '') + currentSessionFinal + currentSessionInterim;
        setInputText(newText);

        // Auto-send logic (only in voice mode and based on final results)
        if (isVoiceModeRef.current && currentSessionFinal.trim().length > 0) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (sendMessageRef.current) {
              sendMessageRef.current();
            }
          }, 1500);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsDictating(false);
      setIsListening(false);
      setIsVoiceMode(false);
    };

    recognition.onend = () => {
      // Auto-restart only if we're supposed to be dictating (not in voice mode listening cycle)
      if (isDictatingRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, []);

  const toggleDictation = () => {
    if (isDictating) {
      recognition.stop();
      setIsDictating(false);
    } else {
      if (recognition) {
        try {
          recognition.start();
          setIsDictating(true);
        } catch (e) {
          console.warn("Recognition already running:", e);
          setIsDictating(true); // Sync state if already running
        }
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  };

  const startListeningSession = () => {
    if (!recognition || !isVoiceModeRef.current) return;
    
    // Small delay to let audio hardware settle
    setTimeout(() => {
      try {
        recognition.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (e) {
        // If already started, just ensure state is sync'd
        setIsListening(true);
        isListeningRef.current = true;
      }
    }, 300);
  };

  const toggleVoiceMode = async () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    
    if (isVoiceMode) {
      // Stopping Voice Mode
      setIsVoiceMode(false);
      isVoiceModeRef.current = false;
      recognition.stop();
      setIsListening(false);
      isListeningRef.current = false;
      
      // STOP AI SPEECH and RESET ANIMATION
      window.speechSynthesis.cancel();
      setActiveVoiceMessageId(null);
      setCurrentSpokenWordIndex(-1);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    } else {
      // Starting Voice Mode - REQUEST PERMISSION FIRST
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        setIsVoiceMode(true);
        isVoiceModeRef.current = true;
        setIsListening(false);
        isListeningRef.current = false;
        
        const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai');
        if (lastAiMsg) {
          const utterance = speakMessage(lastAiMsg.text, lastAiMsg.id);
          if (utterance) {
            utterance.onend = () => {
              if (isVoiceModeRef.current) {
                startListeningSession();
              }
            };
          }
        } else {
          startListeningSession();
        }
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access is required for Voice Mode. Please enable it in your browser settings.");
      }
    }
  };

  const speakMessage = (text, messageId) => {
    if (!('speechSynthesis' in window)) return null;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // HUMAN VOICE SELECTION
    const voices = window.speechSynthesis.getVoices();
    // Prioritize "Neural", "Enhanced", or high-quality specific voices
    const premiumVoice = voices.find(v => 
      v.name.includes('Neural') || 
      v.name.includes('Enhanced') || 
      v.name.includes('Google US English') || 
      v.name.includes('Samantha') || 
      v.name.includes('Premium')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    
    if (premiumVoice) utterance.voice = premiumVoice;
    
    // Natural conversational settings
    utterance.rate = 1.0;  // Natural human speed
    utterance.pitch = 0.98; // Slightly warmer/deeper tone
    utterance.volume = 1.0;

    // Track word boundaries for "Lyrics" animation
    if (messageId) {
      setActiveVoiceMessageId(messageId);
      setCurrentSpokenWordIndex(-1);
      
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const textUpToBoundary = text.substring(0, event.charIndex);
          const words = textUpToBoundary.trim().split(/\s+/);
          const wordIndex = textUpToBoundary.trim() === '' ? 0 : words.length;
          setCurrentSpokenWordIndex(wordIndex);
        }
      };

      utterance.onend = () => {
        setActiveVoiceMessageId(null);
        setCurrentSpokenWordIndex(-1);
      };
    }
    
    window.speechSynthesis.speak(utterance);
    return utterance;
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    const userText = inputText.trim();
    if (!userText || isTyping || isStreaming) return;

    const sessionId = sessionData?.sessionId;
    const wasInVoiceMode = isVoiceMode; 

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
    
    // Stop listening while AI is thinking/speaking
    if (wasInVoiceMode) {
      recognition.stop();
      setIsListening(false);
    }

    // Reset streaming speech state
    speechQueueRef.current = [];
    isSpeakingChunkRef.current = false;
    totalWordsSpokenRef.current = 0;
    let lastProcessedIndex = 0;
    let accumulatedResponse = '';

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
      let lineBuffer = '';

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
        lineBuffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const dataStr = trimmedLine.substring(6).trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) {
              accumulatedResponse += parsed.content;
              
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex]?.sender === 'ai') {
                  newMessages[lastIndex] = { ...newMessages[lastIndex], text: accumulatedResponse };
                }
                return newMessages;
              });

              if (wasInVoiceMode) {
                const sentenceEndRegex = /[.!?](\s+|\n|$)/g;
                let match;
                while ((match = sentenceEndRegex.exec(accumulatedResponse.slice(lastProcessedIndex))) !== null) {
                  const endPos = lastProcessedIndex + match.index + match[0].length;
                  const sentence = accumulatedResponse.slice(lastProcessedIndex, endPos).trim();
                  
                  if (sentence) {
                    speechQueueRef.current.push(sentence);
                    if (!isSpeakingChunkRef.current) {
                      processSpeechQueue(aiMsgId);
                    }
                  }
                  lastProcessedIndex = endPos;
                }
              }

              await new Promise(resolve => setTimeout(resolve, 15));
            }
          } catch (err) {}
        }
      }
      
      setIsStreaming(false);

      if (wasInVoiceMode && lastProcessedIndex < accumulatedResponse.length) {
        const remaining = accumulatedResponse.slice(lastProcessedIndex).trim();
        if (remaining) {
          speechQueueRef.current.push(remaining);
          if (!isSpeakingChunkRef.current) {
            processSpeechQueue(aiMsgId);
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const processSpeechQueue = (messageId) => {
    if (!isVoiceModeRef.current) {
      speechQueueRef.current = [];
      isSpeakingChunkRef.current = false;
      return;
    }

    if (speechQueueRef.current.length === 0) {
      isSpeakingChunkRef.current = false;
      if (isVoiceModeRef.current) {
        startListeningSession();
      }
      return;
    }

    isSpeakingChunkRef.current = true;
    const sentence = speechQueueRef.current.shift();
    
    const utterance = new SpeechSynthesisUtterance(sentence);
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      v.name.includes('Neural') || 
      v.name.includes('Enhanced') || 
      v.name.includes('Google US English') || 
      v.name.includes('Samantha') || 
      v.name.includes('Premium')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    
    if (premiumVoice) utterance.voice = premiumVoice;
    utterance.rate = 1.0;
    utterance.pitch = 0.98;
    
    const wordOffset = totalWordsSpokenRef.current;
    setActiveVoiceMessageId(messageId);
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const textUpToChar = sentence.substring(0, event.charIndex);
        const wordsInChunk = textUpToChar.trim() ? textUpToChar.trim().split(/\s+/).length : 0;
        setCurrentSpokenWordIndex(wordOffset + wordsInChunk);
      }
    };

    utterance.onend = () => {
      totalWordsSpokenRef.current += sentence.trim().split(/\s+/).length;
      processSpeechQueue(messageId);
    };

    window.speechSynthesis.speak(utterance);
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
                activeVoiceMessageId={activeVoiceMessageId}
                currentSpokenWordIndex={currentSpokenWordIndex}
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
          <form onSubmit={handleSendMessage} className={styles.form}>
            <div className={styles.unifiedInputRow}>
              <div className={styles.textPill}>
                <textarea 
                  ref={textareaRef}
                  placeholder={isVoiceMode ? "Listening..." : "Reply to Prep AI..."} 
                  className={styles.textarea}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isVoiceMode}
                />
              </div>

              <div className={styles.actionPill}>
                <button 
                  type="button" 
                  className={`${styles.micBtn} ${isDictating ? styles.activeMic : ''} ${isVoiceMode ? styles.micHidden : ''}`}
                  onClick={toggleDictation}
                  title="Dictate (Speech-to-Text)"
                >
                  <span className="material-symbols-outlined">mic</span>
                </button>
                
                {isVoiceMode ? (
                  <button 
                    type="button"
                    className={styles.voicePillBlue} 
                    onClick={toggleVoiceMode}
                  >
                    <div className={styles.bouncingDots}>
                      <div className={styles.dot} />
                      <div className={styles.dot} />
                      <div className={styles.dot} />
                      <div className={styles.dot} />
                    </div>
                    <span className={styles.endText}>End</span>
                  </button>
                ) : inputText.trim() ? (
                  <button type="submit" className={styles.sendIcon}>
                    <div className={styles.sendIconContent}>
                      <span className="material-symbols-outlined">arrow_upward</span>
                      <span className="material-symbols-outlined" id={styles.sendIconSecond}>arrow_upward</span>
                    </div>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className={styles.voiceModeTrigger} 
                    onClick={toggleVoiceMode}
                    title="Start Voice Mode"
                  >
                    <div className={styles.aiIconCircle}>
                      <img src={aiIcon} alt="AI" className={styles.aiIconImg} />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </form>
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
