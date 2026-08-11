import { useState, useEffect, useRef } from "react";
import api from "../api";

export const useChatLogic = ({
  sessionData,
  onNavigate,
  inputText,
  setInputText,
  voiceMode, // useVoiceMode se aane wali saari cheezein (isVoiceModeRef, speakMessage, etc)
  sendMessageRef, // Taki useVoiceMode silence pe isko call kar sake
  scrollToBottom,
}) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Hint States
  const [showHintNudge, setShowHintNudge] = useState(false);
  const [showHintBox, setShowHintBox] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintText, setHintText] = useState("");
  const [hintCancelCount, setHintCancelCount] = useState(0);
  const lastActionTime = useRef(Date.now());
  const isStreamingRef = useRef(false);

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
          localStorage.removeItem("activeSessionId");
          onNavigate("upload");
          return;
        }

        if (data.success && data.session.transcript.length > 0) {
          const formattedMessages = data.session.transcript.map((m, idx) => ({
            id: m._id || `msg-${idx}-${Date.now()}`,
            sender: m.role === "assistant" ? "ai" : "user",
            text: m.content,
            timestamp: m.timestamp
              ? new Date(m.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
              : "Earlier",
            date: m.timestamp ? new Date(m.timestamp) : new Date(),
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
              sender: "ai",
              text: sessionData.firstMessage,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    restoreSession();
  }, [sessionData, messages.length, onNavigate]);

  // Main message sending logic with SSE Streaming and Voice Integration
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (voiceMode.silenceTimerRef?.current) clearTimeout(voiceMode.silenceTimerRef.current);

    const userText = inputText.trim();
    if (!userText || isTyping || isStreaming) return;

    const sessionId = sessionData?.sessionId;
    const wasInVoiceMode = voiceMode.isVoiceModeRef.current;

    const newUserMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setIsTyping(true);
    
    // Auto scroll down to show the new message
    setTimeout(() => scrollToBottom(), 100);

    // Agar Voice Mode me hai toh mic sunna band kare jab AI soch/bol raha ho
    if (wasInVoiceMode) {
      const rec = voiceMode.recognitionRef.current;
      if (rec) {
        try { rec.stop(); } catch (e) {}
      }
      voiceMode.isListeningRef.current = false;
    }

    // Reset streaming speech queue
    voiceMode.speechQueueRef.current = [];
    voiceMode.isSpeakingChunkRef.current = false;
    voiceMode.totalWordsSpokenRef.current = 0;
    
    let lastProcessedIndex = 0;
    let accumulatedResponse = "";

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/interview/chat/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: userText }),
        },
      );

      if (!response.ok) throw new Error("Out of service for message");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";

      setIsTyping(false);
      setIsStreaming(true);
      isStreamingRef.current = true;

      // Initialize empty AI message
      const aiMsgId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: "ai",
          text: "",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: new Date(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          const dataStr = trimmedLine.substring(6).trim();
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) {
              accumulatedResponse += parsed.content;

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex]?.sender === "ai") {
                  newMessages[lastIndex] = { ...newMessages[lastIndex], text: accumulatedResponse };
                }
                return newMessages;
              });

              // Agar Voice Mode on tha, toh words jama karke queue me bhejo bolne ke liye
              if (wasInVoiceMode) {
                const sentenceEndRegex = /[.!?](\s+|\n|$)/g;
                let match;
                while ((match = sentenceEndRegex.exec(accumulatedResponse.slice(lastProcessedIndex))) !== null) {
                  const endPos = lastProcessedIndex + match.index + match[0].length;
                  const sentence = accumulatedResponse.slice(lastProcessedIndex, endPos).trim();

                  if (sentence) {
                    voiceMode.speechQueueRef.current.push(sentence);
                    if (!voiceMode.isSpeakingChunkRef.current) {
                      voiceMode.processSpeechQueue(aiMsgId);
                    }
                  }
                  lastProcessedIndex = endPos;
                }
              }
              await new Promise((resolve) => setTimeout(resolve, 15));
            }
          } catch (err) {}
        }
      }

      setIsStreaming(false);
      isStreamingRef.current = false;

      // Stream finish hone pe bacha hua chunk bolne bhej do
      if (wasInVoiceMode) {
        if (lastProcessedIndex < accumulatedResponse.length) {
          const remaining = accumulatedResponse.slice(lastProcessedIndex).trim();
          if (remaining) voiceMode.speechQueueRef.current.push(remaining);
        }

        if (voiceMode.speechQueueRef.current.length > 0 && !voiceMode.isSpeakingChunkRef.current) {
          voiceMode.processSpeechQueue(aiMsgId);
        } else if (voiceMode.speechQueueRef.current.length === 0 && !voiceMode.isSpeakingChunkRef.current) {
          voiceMode.updateActiveVoiceMessageId(null);
          voiceMode.startListeningSession();
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      setIsTyping(false);
      setIsStreaming(false);
      isStreamingRef.current = false;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "System is currently out of service. Please try again after a while.",
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: new Date(),
        },
      ]);

      if (wasInVoiceMode) {
        voiceMode.stopVoiceMode();
      }
    }
  };

  // Wire up the ref so Voice mode can trigger it on silence
  useEffect(() => {
    if (sendMessageRef) sendMessageRef.current = handleSendMessage;
  }, [handleSendMessage, sendMessageRef]);

  // Hint request function
  const requestHint = async () => {
    setIsHintLoading(true);
    setHintText("");

    try {
      const token = localStorage.getItem("token");
      const sessionId = sessionData?.sessionId;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/interview/hint/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messageHistory: [] }),
      });

      const data = await response.json();
      if (data.success) {
        setHintText(data.hint);
      } else {
        setHintText("I'm sorry, I couldn't generate a hint right now.");
      }
    } catch (err) {
      console.error("Hint Fetch Error:", err);
      setHintText("Failed to connect to the hint service.");
    } finally {
      setIsHintLoading(false);
      setShowHintBox(true);
      setShowHintNudge(false);
    }
  };

  return {
    messages,
    setMessages,
    isTyping,
    isStreaming,
    isStreamingRef,
    isInitialLoading,
    isResumed,
    isExiting,
    handleSendMessage,
    requestHint,
    showHintNudge,
    setShowHintNudge,
    showHintBox,
    setShowHintBox,
    isHintLoading,
    hintText,
    hintCancelCount,
    setHintCancelCount,
    lastActionTime
  };
};
