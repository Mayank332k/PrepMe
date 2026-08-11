import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import styles from "../../pages/Chat.module.css";

const languageAliases = {
  js: "javascript",
  node: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  cplusplus: "cpp",
  "c++": "cpp",
  cs: "csharp",
  yml: "yaml",
};

const getCodeLanguage = (className = "") => {
  const match = /language-(\w+)/.exec(className || "");
  let lang = match ? match[1].toLowerCase() : "";
  return languageAliases[lang] || lang;
};

const extractText = (node) => {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return "";
};

const isRedundantHeading = (text) => {
  const lower = String(text).trim().toLowerCase();
  const redundantPhrases = [
    "context",
    "feedback",
    "suggestion",
    "evaluation",
    "review",
  ];
  return redundantPhrases.some(
    (phrase) => lower === phrase || lower === `${phrase}:`,
  );
};

const shouldUseAccentBar = (text, isBlockquote = false) => {
  if (isBlockquote) return true;

  const accentKeywords = [
    "context",
    "feedback",
    "rule of thumb",
    "pro tip",
    "best practice",
    "watch out",
    "warning",
    "next step",
    "next steps",
    "moving forward",
    "important",
    "note",
    "tip",
    "takeaway",
    "key takeaway",
    "key takeaways",
    "hint",
    "insight",
    "summary",
    "overview",
    "evaluation",
    "assessment",
    "review",
    "observation",
    "strength",
    "improvement",
    "suggestion"
  ];

  const lower = String(text).toLowerCase();
  const pattern = new RegExp(
    `\\b(${accentKeywords
      .map((kw) => kw.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&"))
      .join("|")})\\b`,
    "i"
  );

  return pattern.test(lower);
};

const renderHeadingOrQuestion = (Tag, defaultClassName, { children, ...props }) => {
  const rawText = extractText(children);

  if (isRedundantHeading(rawText)) {
    return null;
  }

  if (shouldUseAccentBar(rawText, Tag === "blockquote")) {
    return (
      <div className={styles.questionCard}>
        <div className={styles.questionCardInner}>
          <div className={styles.questionAccentBar} />
          <div className={styles.questionContent}>
            <div className={styles.questionText}>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Tag className={defaultClassName} {...props}>
      {children}
    </Tag>
  );
};

const MarkdownComponents = {
  h1: (props) => renderHeadingOrQuestion("h1", styles.heading1, props),
  h2: (props) => renderHeadingOrQuestion("h2", styles.heading2, props),
  h3: (props) => renderHeadingOrQuestion("h3", styles.heading3, props),
  h4: (props) => renderHeadingOrQuestion("h4", styles.heading4, props),
  blockquote: (props) => renderHeadingOrQuestion("blockquote", "", props),
  p: (props) => {
    const rawText = extractText(props.children).trim();
    // Check if paragraph begins with an accent keyword label (e.g. "Feedback:" or "**Context:**")
    const firstWordMatch = rawText.match(/^([A-Za-z\s-]+)([:.-]|\s{2,})/);
    if (firstWordMatch && shouldUseAccentBar(firstWordMatch[1])) {
      return (
        <div className={styles.questionCard}>
          <div className={styles.questionCardInner}>
            <div className={styles.questionAccentBar} />
            <div className={styles.questionContent}>
              <div className={styles.questionText}>{props.children}</div>
            </div>
          </div>
        </div>
      );
    }
    return <p {...props}>{props.children}</p>;
  },
  pre: ({ children }) => {
    const codeEl = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && (child.type === "code" || child.props?.mdastName === "code")
    );
    if (codeEl) {
      const { className, children: codeChildren } = codeEl.props;
      const language = getCodeLanguage(className);
      return (
        <CodeBlock
          language={language || "text"}
          value={String(codeChildren).replace(/\n$/, "")}
        />
      );
    }
    return <pre>{children}</pre>;
  },
};

// Helper to clean markdown for Voice Mode
const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italic
    .replace(/__(.*?)__/g, "$1") // Bold underscore
    .replace(/_(.*?)_/g, "$1") // Italic underscore
    .replace(/`(.*?)`/g, "$1") // Inline code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
    .replace(/#+\s/g, "") // Headers
    .trim();
};

const ChatMessage = React.memo(
  ({
    msg,
    activeMenuId,
    setActiveMenuId,
    sessionData,
    activeVoiceMessageId,
    currentSpokenWordIndex,
    isGlowing,
    onSpeak,
    onStopSpeak,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 150;
    const isLongUserMsg = msg.sender === "user" && msg.text.length > MAX_LENGTH;
    
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
        const activeWord = lyricContainerRef.current.querySelector(
          `.${styles.wordActive}`,
        );
        const viewport = lyricContainerRef.current.closest(
          `.${styles.lyricViewport}`,
        );

        if (activeWord && viewport) {
          const viewportHeight = viewport.offsetHeight;
          const wordOffset = activeWord.offsetTop;
          const wordHeight = activeWord.offsetHeight;

          // Calculate the translation needed to put the active word at the center of the viewport
          // Use translate3d for hardware acceleration and sub-pixel accuracy
          const targetScroll = wordOffset - viewportHeight / 2 + wordHeight / 2;
          lyricContainerRef.current.style.transform = `translate3d(0, ${-targetScroll}px, 0)`;
        }
      }
    }, [currentSpokenWordIndex, isSpeaking]);

    return (
      <div
        className={`${styles.messageRow} ${msg.sender === "user" ? styles.userRow : styles.aiRow}`}
      >
        <div className={styles.messageRowInner}>
          <div className={styles.messageBody}>
            <div className={styles.bubbleContainer}>
              <div
                className={`${styles.bubble} ${isSpeaking ? styles.lyricBubble : ""} ${msg.isError ? styles.errorBubble : ""}`}
              >
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
                                isActive
                                  ? styles.wordActive
                                  : isPast
                                    ? styles.wordPast
                                    : styles.wordFuture
                              }`}
                            >
                              {word.split("").map((char, cIdx) => (
                                <span
                                  key={cIdx}
                                  className={styles.lyricChar}
                                  style={{
                                    transitionDelay: isActive
                                      ? `${cIdx * 0.06}s`
                                      : "0s",
                                  }}
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
                    <>
                      {msg.sender === "user" ? (
                        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {isLongUserMsg && !isExpanded
                            ? (msg.text || "").trim().substring(0, MAX_LENGTH) + "..."
                            : (msg.text || "").trim()}
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                          {(msg.text || "").trim()}
                        </ReactMarkdown>
                      )}
                      {isLongUserMsg && (
                        <button
                          className={styles.expandButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                          }}
                        >
                          <span className="material-symbols-outlined">
                            {isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {msg.sender === "ai" && (
              <div className={styles.messageMetadata}>
                {isSpeaking ? (
                  <button
                    className={`${styles.menuTrigger} ${styles.speakActive}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStopSpeak) onStopSpeak();
                    }}
                    title="Stop speaking"
                  >
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent-color)' }}>
                      stop_circle
                    </span>
                  </button>
                ) : (
                  <button
                    className={styles.menuTrigger}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSpeak) onSpeak(msg.text, msg.id);
                    }}
                    title="Speak message"
                  >
                    <i className="fi fi-br-volume"></i>
                  </button>
                )}
                
                <button
                  className={styles.menuTrigger}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                  }}
                >
                  <i className="fi fi-br-menu-dots-vertical"></i>
                </button>

                {activeMenuId === msg.id && (
                  <div
                    className={styles.infoDropdown}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={styles.infoLabel}>
                      {(() => {
                        const msgDate = msg.date || new Date();
                        const today = new Date();
                        const isToday =
                          msgDate.getDate() === today.getDate() &&
                          msgDate.getMonth() === today.getMonth() &&
                          msgDate.getFullYear() === today.getFullYear();

                        return isToday
                          ? "Today"
                          : msgDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                      })()}
                      , {msg.timestamp}
                    </span>

                    <div className={styles.infoItem}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px", color: "#666" }}
                      >
                        fingerprint
                      </span>
                      <span className={styles.infoValue}>
                        Session #
                        {sessionData?.sessionId?.slice(-6).toUpperCase() ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default ChatMessage;
