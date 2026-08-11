import React, { useState, useEffect, useRef } from "react";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "../../pages/Chat.module.css";

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [value]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeHeader}>
        <div className={styles.codeLang}>
          <span style={{ opacity: 0.6 }}>{"{/}"}</span>
          <span>{language || "code"}</span>
        </div>
        <button
          className={styles.copyBtn}
          onClick={copyToClipboard}
          title="Copy code"
        >
          {copied ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <i className="fi fi-rr-clone" style={{ fontSize: "16px" }}></i>
          )}
        </button>
      </div>
      <div className={styles.codeContent} ref={scrollRef}>
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          useInlineStyles={false}
          PreTag="div"
          codeTagProps={{ style: { backgroundColor: "transparent" } }}
          customStyle={{
            margin: 0,
            padding: "16px 20px",
            backgroundColor: "transparent",
            fontSize: "14.5px",
            lineHeight: "1.6",
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
