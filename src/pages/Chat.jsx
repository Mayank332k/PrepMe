import React, { useState, useEffect, useRef, useMemo } from "react";
import { Mic02Icon } from "hugeicons-react";
import api from "../api";
import { Sidebar } from "../components/layout/Sidebar";
import { MobileNav } from "../components/layout/MobileNav";
import CodeBlock from "../components/Chat/CodeBlock";
import ChatMessage from "../components/Chat/ChatMessage";
import { ErrorNotification } from "../components/ui/ErrorNotification";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import styles from "./Chat.module.css";

// Detect browser support — actual instance is created lazily per session
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

// CodeBlock has been moved to src/components/Chat/CodeBlock.jsx
// ChatMessage and Markdown rules have been moved to src/components/Chat/ChatMessage.jsx

import { useVoiceMode } from "../hooks/useVoiceMode";
import { useChatLogic } from "../hooks/useChatLogic";

export const Chat = ({ user, sessionData, onEndSession, onNavigate }) => {
  const [inputText, setInputText] = useState(() => {
    if (sessionData?.sessionId) {
      return localStorage.getItem(`chat_draft_${sessionData.sessionId}`) || "";
    }
    return "";
  });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showPillMenu, setShowPillMenu] = useState(false);
  
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showVoiceBetaModal, setShowVoiceBetaModal] = useState(false);
  const [voiceToast, setVoiceToast] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const pillMenuRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const chatCanvasRef = useRef(null);
  const sendMessageRef = useRef(null);
  const inputTextRef = useRef(inputText);
  const voiceToastTimeoutRef = useRef(null);
  const pillRef = useRef(null);
  const orbRef = useRef(null);
  const hintContentRef = useRef(null);

  const { hintsEnabled, setHintsEnabled, hintsForVoice, hintsForChat } = useSettings();
  const { theme, setThemePreference } = useTheme();

  useEffect(() => {
    if (sessionData?.sessionId) {
      if (inputText.trim()) {
        localStorage.setItem(`chat_draft_${sessionData.sessionId}`, inputText);
      } else {
        localStorage.removeItem(`chat_draft_${sessionData.sessionId}`);
      }
    }
  }, [inputText, sessionData?.sessionId]);

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const triggerVoiceToast = (message) => {
    if (voiceToastTimeoutRef.current) clearTimeout(voiceToastTimeoutRef.current);
    setVoiceToast(message);
    voiceToastTimeoutRef.current = setTimeout(() => setVoiceToast(null), 6000);
  };

  useEffect(() => {
    return () => {
      if (voiceToastTimeoutRef.current) clearTimeout(voiceToastTimeoutRef.current);
    };
  }, []);

  // --- Voice Mode Hook ---
  const voiceMode = useVoiceMode({
    inputText,
    setInputText,
    inputTextRef,
    sendMessageRef,
    isStreamingRef: { current: false }, // Will sync below
    scrollToBottom,
    textareaRef,
    pillRef,
    orbRef,
    triggerVoiceToast,
    setShowVoiceBetaModal
  });

  const {
    isVoiceMode, isListening, isDictating, activeVoiceMessageId,
    currentSpokenWordIndex, micVolume, toggleDictation, toggleVoiceMode,
    stopSpeakMessage, speakMessage, stopVoiceMode, startVoiceModeConfirm
  } = voiceMode;

  // --- Chat API Logic Hook ---
  const chatLogic = useChatLogic({
    sessionData,
    onNavigate,
    inputText,
    setInputText,
    voiceMode,
    sendMessageRef,
    scrollToBottom,
  });

  const {
    messages, setMessages, isTyping, isStreaming, isInitialLoading,
    isResumed, isExiting, handleSendMessage, requestHint,
    showHintNudge, setShowHintNudge, showHintBox, setShowHintBox,
    isHintLoading, hintText, hintCancelCount, setHintCancelCount, lastActionTime
  } = chatLogic;

  // Sync Streaming state to Voice Mode
  useEffect(() => {
    voiceMode.isStreamingRef = chatLogic.isStreamingRef;
  }, [chatLogic.isStreamingRef, voiceMode]);

  const hintsAllowed = useMemo(() => {
    return hintsEnabled && (isVoiceMode ? hintsForVoice : hintsForChat);
  }, [hintsEnabled, isVoiceMode, hintsForVoice, hintsForChat]);

  useEffect(() => {
    if (!hintsAllowed) {
      setShowHintNudge(false);
      setShowHintBox(false);
    }
  }, [hintsAllowed, setShowHintNudge, setShowHintBox]);

  // Hint Resize Observer (UI specific)
  const [hintHeight, setHintHeight] = useState("44px");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!showHintBox) {
      setHintHeight("44px");
      setDimensions({ width: 0, height: 0 });
      return;
    }
    if (!hintContentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const contentHeight = entry.contentRect.height;
        const contentWidth = entry.contentRect.width;
        const isMobile = window.innerWidth <= 768;
        const totalHeight = contentHeight + (isMobile ? 28 : 32);
        const totalWidth = contentWidth + (isMobile ? 36 : 40);

        setDimensions({ width: totalWidth, height: totalHeight });
        setHintHeight(`${totalHeight}px`);
      }
    });

    observer.observe(hintContentRef.current);
    return () => observer.disconnect();
  }, [showHintBox, isHintLoading, hintText]);

  const getBorderPaths = () => {
    const isMobile = window.innerWidth <= 768;
    const r = isMobile ? 34 : 28;
    const w = dimensions.width;
    const h = dimensions.height;
    const offset = 0.5;

    if (w <= 0 || h <= 0) return { left: "", right: "" };
    const left = `M ${w / 2} ${offset} L ${offset + r} ${offset} A ${r} ${r} 0 0 0 ${offset} ${offset + r} L ${offset} ${h - offset - r} A ${r} ${r} 0 0 0 ${offset + r} ${h - offset} L ${w / 2} ${h - offset}`;
    const right = `M ${w / 2} ${offset} L ${w - offset - r} ${offset} A ${r} ${r} 0 0 1 ${w - offset} ${offset + r} L ${w - offset} ${h - offset - r} A ${r} ${r} 0 0 1 ${w - offset - r} ${h - offset} L ${w / 2} ${h - offset}`;
    return { left, right };
  };

  const { left: leftPath, right: rightPath } = getBorderPaths();

  // Scroll visibility
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 300;
    setShowScrollBtn(!isAtBottom);
  };

  // Textarea auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const startHeight = textarea.style.height;
      textarea.style.height = "auto";
      const targetHeight = `${Math.min(textarea.scrollHeight, 150)}px`;
      textarea.style.height = startHeight;
      requestAnimationFrame(() => {
        textarea.style.height = targetHeight;
      });
    }
  }, [inputText]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isVoiceMode) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isVoiceMode, activeVoiceMessageId, isTyping, inputText]);

  // Pill menu dismiss
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (pillMenuRef.current && !pillMenuRef.current.contains(e.target)) setShowPillMenu(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape") setShowPillMenu(false); };
    if (showPillMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showPillMenu]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Warm up voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    }
  }, []);

  // Keyboard shortcut
  const handleKeyDown = (e) => {
    lastActionTime.current = Date.now();
    if (showHintNudge) setShowHintNudge(false);
    const isDesktop = window.innerWidth > 768 && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (e.key === "Enter") {
      if (isDesktop && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      } else if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    }
  };

  // Prevent scroll when beta modal open
  useEffect(() => {
    if (showVoiceBetaModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [showVoiceBetaModal]);

  // Cleanup voice on unmount (navigating away / session end)
  useEffect(() => {
    return () => {
      stopVoiceMode();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.pageContainer}>
      <Sidebar user={user} activeTab="chat" onNavigate={onNavigate} />

      <main className={styles.mainCanvas}>
        <ErrorNotification 
          visible={!!voiceToast} 
          message={voiceToast?.message || voiceToast} 
          type={voiceToast?.type || 'error'} 
        />
        <header className={styles.header}>
          {/* Progressive Cloud Blur Layers */}
          <div className={styles.headerBlurContainer}>
            <div className={styles.blurLayer1}></div>
            <div className={styles.blurLayer2}></div>
            <div className={styles.blurLayer3}></div>
          </div>
          <button
            className={`${styles.backBtn} ${voiceToast ? styles.headerElementHidden : ""}`}
            onClick={() => setShowBackConfirm(true)}
            style={{ WebkitBackdropFilter: 'blur(5.5px)', backdropFilter: 'blur(5.5px)', willChange: 'transform, backdrop-filter' }}
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
          <div className={`${styles.endPillWrapper} ${voiceToast ? styles.headerElementHidden : ""}`}>
            <div
              className={`${styles.endPill} ${showPillMenu ? styles.menuOpen : ""}`}
              ref={pillMenuRef}
              style={{ WebkitBackdropFilter: 'blur(5.5px)', backdropFilter: 'blur(5.5px)', willChange: 'transform, backdrop-filter' }}
            >
              <div className={styles.pillBaseContent}>
                <button
                  className={styles.endActionBtn}
                  onClick={() => setShowEndConfirm(true)}
                  disabled={isTyping || isStreaming || isEnding}
                >
                  {isEnding ? (
                    <div className={styles.dashedSpinner}></div>
                  ) : (
                    <>
                      <i className="fi fi-br-assessment" style={{ fontSize: '18px' }}></i>
                      <span className={styles.endBtnText}>End Session</span>
                    </>
                  )}
                </button>
                <button
                  className={styles.menuActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPillMenu(!showPillMenu);
                  }}
                >
                  <div className={styles.customDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </button>
              </div>

              <div className={styles.pillMenuContent}>
                <div className={styles.settingsRow}>
                  <span>Dark Mode</span>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${theme === 'dark' ? styles.active : ""}`}
                    onClick={() => setThemePreference(theme === 'dark' ? 'light' : 'dark')}
                  >
                    <div className={styles.toggleKnob}></div>
                  </button>
                </div>
                <div className={styles.settingsRow}>
                  <span>Hints</span>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${hintsEnabled ? styles.active : ""}`}
                    onClick={() => setHintsEnabled(!hintsEnabled)}
                  >
                    <div className={styles.toggleKnob}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {showBackConfirm && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowBackConfirm(false)}
          >
            <div
              className={styles.confirmCardMinimal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.minimalHeader}>
                <h3 className={styles.minimalTitle}>Leave Interview?</h3>
                <p className={styles.minimalSubtext}>
                  Progress in this session will not be saved.
                </p>
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
                  onClick={async () => {
                    const sessionId = sessionData?.sessionId;
                    if (sessionId) {
                      try {
                        await fetch(`${import.meta.env.VITE_API_URL}/interview/session/${sessionId}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: "include",
                          body: JSON.stringify({ status: 'abandoned' })
                        });
                      } catch (error) {
                        console.error("Failed to abandon session:", error);
                      }
                    }
                    localStorage.removeItem("activeSessionId");
                    onNavigate("history", true);
                  }}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}
        {showEndConfirm && (
          <div
            className={styles.modalOverlay}
            onClick={() => !isEnding && setShowEndConfirm(false)}
          >
            <div
              className={styles.confirmCardMinimal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.minimalHeader}>
                <h3 className={styles.minimalTitle}>End Session?</h3>
                <p className={styles.minimalSubtext}>
                  this will eval the final result of this interview
                </p>
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
                  className={`${styles.minimalEndBtn} ${isEnding ? styles.centeredEnd : ""}`}
                  onClick={async () => {
                    stopVoiceMode(); // Kill voice before ending session
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
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className={styles.iosBar}></div>
                      ))}
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
              <div
                className={`${styles.resumedPill} ${isExiting ? styles.pillExiting : ""}`}
              >
                <span
                  className={`material-symbols-outlined ${styles.resumedIcon}`}
                >
                  check_circle
                </span>
                <span className={styles.resumedText}>Session Resumed</span>
              </div>
            )}

            {isInitialLoading && messages.length === 0 ? (
              <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "50vh", width: "100%" }}>
                <div className={styles.iosSpinner} style={{ width: "24px", height: "24px", color: "var(--text-muted)" }}>
                  <div className={styles.iosBar}></div>
                  <div className={styles.iosBar}></div>
                  <div className={styles.iosBar}></div>
                  <div className={styles.iosBar}></div>
                  <div className={styles.iosBar}></div>
                  <div className={styles.iosBar}></div>
                  <div className={styles.iosBar}></div>
                  <div className={styles.iosBar}></div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  sessionData={sessionData}
                  activeVoiceMessageId={activeVoiceMessageId}
                  currentSpokenWordIndex={currentSpokenWordIndex}
                  isGlowing={isStreaming && index === messages.length - 1}
                  onSpeak={speakMessage}
                  onStopSpeak={stopSpeakMessage}
                />
              ))
            )}

            {isVoiceMode && !activeVoiceMessageId && !isTyping && (
              <div
                className={`${styles.messageRow} ${styles.aiRow} ${styles.listeningRow}`}
              >
                <div className={styles.messageBody}>
                  <div className={styles.bubbleContainer}>
                    <div className={`${styles.bubble} ${styles.lyricBubble}`}>
                      <div className={styles.lyricViewport} ref={orbRef}>
                        <div className={styles.voiceListeningContainer}>
                          <div className={styles.voicePillsVisualizer}>
                            <span className={styles.voicePillBar} />
                            <span className={styles.voicePillBar} />
                            <span className={styles.voicePillBar} />
                          </div>
                          <p className={styles.voiceListeningSubtitle}>
                            {inputText.trim()
                              ? inputText
                              : "Ok, I'm listening..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTyping && (
              <div className={`${styles.messageRow} ${styles.aiRow}`}>
                <div className={styles.messageRowInner}>
                  <div className={styles.messageBody}>
                    <div className={styles.skeletonContainer}>
                      <div className={styles.skeletonLine}></div>
                      <div
                        className={`${styles.skeletonLine} ${styles.short}`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div
              ref={scrollRef}
              style={{ height: "1px", paddingBottom: "77px", flexShrink: 0 }}
            />
          </div>
        </section>

        <footer className={styles.footer}>
          {/* Progressive Cloud Blur Layers for Footer */}
          <div className={styles.footerBlurContainer}>
            <div className={styles.footerBlurLayer1}></div>
            <div className={styles.footerBlurLayer2}></div>
            <div className={styles.footerBlurLayer3}></div>
          </div>
          <form onSubmit={handleSendMessage} className={styles.form}>
            <div
              className={`${styles.textareaPill} ${inputText.trim().length > 0 ? styles.activePill : ""}`}
              style={{
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                backdropFilter: 'blur(16px) saturate(180%)',
                willChange: 'transform, backdrop-filter, width, border-radius, box-shadow, border-color',
              }}
            >
              <textarea
                ref={textareaRef}
                placeholder={
                  activeVoiceMessageId
                    ? "Speaking..."
                    : isVoiceMode
                    ? "Listening..."
                    : "Reply to Prep AI..."
                }
                className={styles.textarea}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isVoiceMode}
              />

              <div className={styles.pillActions}>
                <button
                  type="button"
                  className={`${styles.micBtn} ${isDictating ? styles.activeMic : ""} ${isVoiceMode ? styles.micHidden : ""}`}
                  onClick={toggleDictation}
                  title={
                    SpeechRecognition
                      ? "Dictate (Speech-to-Text)"
                      : "Speech recognition is not supported in your browser"
                  }
                  disabled={!SpeechRecognition}
                  style={
                    !SpeechRecognition
                      ? { opacity: 0.4, cursor: "not-allowed" }
                      : {}
                  }
                >
                  <Mic02Icon size={24} />
                </button>

                {isVoiceMode ? (
                  <button
                    ref={pillRef}
                    type="button"
                    className={styles.voicePillBlue}
                    onClick={toggleVoiceMode}
                    style={{ "--volume": micVolume }}
                  >
                    <div className={styles.bouncingDots}>
                      <div className={styles.dot} />
                      <div className={styles.dot} />
                      <div className={styles.dot} />
                    </div>
                    <span className={styles.endText}>End</span>
                  </button>
                ) : activeVoiceMessageId ? (
                  <button
                    type="button"
                    className={styles.sendIcon}
                    onClick={stopSpeakMessage}
                    title="Stop Speaking"
                    style={{ backgroundColor: "#ef4444", borderColor: "#ef4444", color: "#ffffff" }}
                  >
                    <div className={styles.sendIconContent}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="5" y="5" width="14" height="14" rx="3" />
                      </svg>
                    </div>
                  </button>
                ) : (isTyping || isStreaming) ? (
                  <button type="button" className={`${styles.sendIcon} ${styles.loadingBtn}`} disabled title="Generating answer...">
                    <div className={styles.shimmerSpinner}></div>
                  </button>
                ) : inputText.trim() ? (
                  <button type="submit" className={styles.sendIcon}>
                    <div className={styles.sendIconContent}>
                      <span className="material-symbols-outlined">
                        arrow_upward
                      </span>
                      <span
                        className="material-symbols-outlined"
                        id={styles.sendIconSecond}
                      >
                        arrow_upward
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.voiceModeTrigger}
                    onClick={toggleVoiceMode}
                    title={
                      SpeechRecognition
                        ? "Start Voice Mode"
                        : "Speech recognition is not supported in your browser"
                    }
                    disabled={!SpeechRecognition}
                    style={
                      !SpeechRecognition
                        ? { opacity: 0.4, cursor: "not-allowed" }
                        : {}
                    }
                  >
                    <i className="fi fi-br-waveform-path" style={{ fontSize: '18px' }}></i>
                  </button>
                )}
              </div>
            </div>
          </form>
        </footer>

        {/* Unified Morphing Hint Container */}
        {hintsAllowed && (showHintNudge || showHintBox) && (!isHintLoading || showHintBox) && (
          <div
            className={`${styles.hintContainer} ${showHintBox ? styles.hintExpanded : styles.hintPill} ${showHintBox && hintText ? styles.hintLoaded : ""}`}
            style={{ height: hintHeight, WebkitBackdropFilter: 'blur(5.5px) saturate(180%)', backdropFilter: 'blur(5.5px) saturate(180%)', willChange: 'transform, backdrop-filter' }}
          >
            {!showHintBox ? (
              <div className={styles.hintPillContent}>
                <button className={styles.nudgeBtn} onClick={requestHint}>
                  <span className="material-symbols-outlined">
                    lightbulb
                  </span>
                  Hints
                </button>
                <button
                  className={styles.nudgeClose}
                  onClick={() => {
                    setShowHintNudge(false);
                    setHintCancelCount((prev) => prev + 1);
                    lastActionTime.current = Date.now();
                  }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ) : (
              <div className={styles.hintExpandedContent} ref={hintContentRef}>
                <div className={styles.hintHeader}>
                  <div className={styles.hintTitle}>
                    <span className="material-symbols-outlined">lightbulb</span>
                    Hint
                  </div>
                  <div className={styles.hintActions}>
                    <button
                      className={`${styles.hintRegen} ${isHintLoading ? styles.hintRegenSpin : ""}`}
                      onClick={requestHint}
                      disabled={isHintLoading}
                      title="Regenerate Hint"
                    >
                      <span className="material-symbols-outlined">refresh</span>
                    </button>
                    <button
                      className={styles.hintClose}
                      onClick={() => setShowHintBox(false)}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
                <div className={styles.hintBody}>
                  {isHintLoading ? (
                    <div className={styles.hintSkeleton}>
                      <div className={styles.hintSkeletonLine} />
                      <div className={`${styles.hintSkeletonLine} ${styles.hintSkeletonShort}`} />
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hintText}</ReactMarkdown>
                  )}
                </div>
              </div>
            )}

            {showHintBox &&
              hintText &&
              dimensions.width > 0 &&
              leftPath &&
              rightPath && (
                <svg className={styles.borderSvg} width="100%" height="100%">
                  <path
                    className={styles.borderRect}
                    d={leftPath}
                    pathLength="100"
                  />
                  <path
                    className={styles.borderRect}
                    d={rightPath}
                    pathLength="100"
                  />
                </svg>
              )}
          </div>
        )}
        {((!showHintBox && isHintLoading) || (showScrollBtn && !isHintLoading && !showHintNudge && !showHintBox)) && (
          <button
            className={`${styles.scrollDownBtn} ${!showHintBox && isHintLoading ? styles.scrollDownBtnLoading : ""}`}
            onClick={!showHintBox && isHintLoading ? undefined : scrollToBottom}
            title={!showHintBox && isHintLoading ? "Loading hint..." : "Scroll to bottom"}
            style={{ WebkitBackdropFilter: 'blur(16px) saturate(200%)', backdropFilter: 'blur(16px) saturate(200%)', willChange: 'transform, backdrop-filter, width, height, border-radius' }}
          >
            {!showHintBox && isHintLoading ? (
              <div className={styles.hintLoadingDots}>
                <div className={styles.hintDot} />
                <div className={styles.hintDot} />
                <div className={styles.hintDot} />
              </div>
            ) : (
              <span className="material-symbols-outlined">arrow_downward</span>
            )}
          </button>
        )}
      </main>

      {showVoiceBetaModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeaderVisual}>
              <div className={styles.pulseRing} />
              <div className={styles.pulseRing} />
              <div className={styles.pulseRing} />
              <div className={styles.glowingOrb}>
                <div className={styles.glowingOrbInner}>
                  <Mic02Icon size={28} />
                </div>
              </div>
            </div>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>Introducing Voice Mode</h3>
              <p className={styles.modalDesc}>
                This is a Beta version of our interactive Voice Mode, so you
                might experience some unexpected bugs or browser freezes. Since
                speech recognition runs in real-time, minor audio delays or
                voice transcription glitches may occur depending on your
                connection. We are actively tuning the interface to improve
                stability!
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowVoiceBetaModal(false)}
                >
                  Continue with Chat
                </button>
                <button
                  type="button"
                  className={styles.btnConfirm}
                  onClick={startVoiceModeConfirm}
                >
                  Try Voice Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
