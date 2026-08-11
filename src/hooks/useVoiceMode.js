import { useState, useRef } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

// Helper: AI ke text se Markdown (**, *, #) hatane ke liye taaki AI usko padhne me gadbad na kare
const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold hatao
    .replace(/\*(.*?)\*/g, "$1") // Italic hatao
    .replace(/__(.*?)__/g, "$1") // Bold underscore hatao
    .replace(/_(.*?)_/g, "$1") // Italic underscore hatao
    .replace(/`(.*?)`/g, "$1") // Inline code hatao
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links hatao
    .replace(/#+\s/g, "") // Headers hatao
    .trim();
};

export const useVoiceMode = ({
  inputText,
  setInputText,
  inputTextRef,
  sendMessageRef,
  isStreamingRef,
  scrollToBottom,
  textareaRef,
  pillRef,
  orbRef,
  triggerVoiceToast,
  setShowVoiceBetaModal,
}) => {
  // Voice aur Mic ke states
  
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  
  // AI Speech ke states (Kaunsa message bol raha hai aur kaunsa word)
  const [activeVoiceMessageId, setActiveVoiceMessageId] = useState(null);
  const [currentSpokenWordIndex, setCurrentSpokenWordIndex] = useState(-1);
  const [micVolume, setMicVolume] = useState(0);

  // Refs: Inka use DOM manipulation aur instant state track ke liye hota hai bina re-render kiye
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isListeningRef = useRef(false);
  const isVoiceModeRef = useRef(false);
  const isDictatingRef = useRef(false);
  const recognitionBaseTextRef = useRef("");

  // AI Speech Queue (Jab AI bada message bhejta hai toh usko tukdo (chunks) me queue karte hain)
  const speechQueueRef = useRef([]);
  const isSpeakingChunkRef = useRef(false);
  const totalWordsSpokenRef = useRef(0);
  const activeVoiceMessageIdRef = useRef(null);
  const fallbackHighlightTimerRef = useRef(null);

  // Visualizer Refs (Mic waves dikhane ke liye)
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const visualizerIntervalRef = useRef(null);

  // Jab AI bolna shuru karta hai toh uska ID update karo (Sync with Ref)
  const updateActiveVoiceMessageId = (id) => {
    setActiveVoiceMessageId(id);
    activeVoiceMessageIdRef.current = id;
  };

  // 🎤 Speech Recognition Setup
  const bindRecognitionHandlers = (rec) => {
    // Jab user bolna shuru kare
    rec.onstart = () => {
      recognitionBaseTextRef.current = inputTextRef.current;
    };

    // Jab user bolta hai aur browser text transcript wapas deta hai
    rec.onresult = (event) => {
      let currentSessionFinal = "";
      let currentSessionInterim = "";

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentSessionFinal += event.results[i][0].transcript;
        } else {
          currentSessionInterim += event.results[i][0].transcript;
        }
      }

      if (isDictatingRef.current || isListeningRef.current) {
        const base = recognitionBaseTextRef.current;
        const newText =
          base +
          (base && !base.endsWith(" ") ? " " : "") +
          currentSessionFinal +
          currentSessionInterim;
        setInputText(newText);

        // Agar user ruk jaye (2000ms tak), toh apne aap message bhej do
        if (isVoiceModeRef.current && currentSessionFinal.trim().length > 0) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (sendMessageRef.current) {
              sendMessageRef.current();
            }
          }, 2000); // User requested 2000ms silence threshold
        }
      }
    };

    rec.onerror = (event) => {
      // Sirf in dono ko safely ignore karenge kyunki onend wapas start kar dega
      if (event.error === "no-speech" || event.error === "aborted") {
        return; 
      }

      // Baki saare serious errors hain, unko catch karke Voice Mode band karenge
      if (triggerVoiceToast) {
        if (event.error === "not-allowed") {
          triggerVoiceToast({ message: "Microphone access denied. Please allow permissions in your browser.", type: "warning" });
        } else if (event.error === "network") {
          triggerVoiceToast({ message: "Network error: Some browsers may not fully support Voice Mode. Try Chrome or Safari.", type: "error" });
        } else if (event.error === "audio-capture") {
          triggerVoiceToast({ message: "No microphone detected. Please check your hardware.", type: "error" });
        } else {
          triggerVoiceToast({ message: `Speech recognition error: ${event.error}`, type: "error" });
        }
      }

      // Voice mode band kar do automatically
      setIsDictating(false);
      isDictatingRef.current = false;
      setIsListening(false);
      isListeningRef.current = false;
      setIsVoiceMode(false);
      isVoiceModeRef.current = false;
    };

    rec.onend = () => {
      // Loop mic to keep it listening continuously
      if (isDictatingRef.current) {
        setTimeout(() => {
          if (isDictatingRef.current) {
            try {
              rec.start();
            } catch (e) {}
          }
        }, 400);
      } else if (isVoiceModeRef.current && isListeningRef.current) {
        setTimeout(() => {
          if (isVoiceModeRef.current && isListeningRef.current) {
            try {
              rec.start();
            } catch (e) {
              setIsListening(false);
              isListeningRef.current = false;
            }
          }
        }, 400);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };
  };

  // Toggle Normal Dictation (Bina AI voice mode ke sirf type karna)
  const toggleDictation = () => {
    const rec = recognitionRef.current;
    if (isDictating) {
      if (rec)
        try {
          rec.stop();
        } catch (e) {}
      setIsDictating(false);
      isDictatingRef.current = false;
    } else {
      if (!SpeechRecognition) {
        if (triggerVoiceToast) triggerVoiceToast({ message: "Speech recognition is not supported in your browser.", type: "error" });
        return;
      }
      const newRec = new SpeechRecognition();
      newRec.continuous = true;
      newRec.interimResults = true;
      newRec.lang = "en-US";
      newRec.maxAlternatives = 1;
      recognitionRef.current = newRec;
      bindRecognitionHandlers(newRec);
      try {
        newRec.start();
        setIsDictating(true);
        isDictatingRef.current = true;
      } catch (e) {
        console.error("Dictation start error:", e);
        if (triggerVoiceToast) triggerVoiceToast({ message: "Microphone error. Please check permissions.", type: "error" });
        setIsDictating(false);
        isDictatingRef.current = false;
      }
    }
  };

  const startListeningSession = () => {
    const rec = recognitionRef.current;
    if (!rec || !isVoiceModeRef.current) return;
    try {
      rec.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch (e) {
      setIsListening(true);
      isListeningRef.current = true;
    }
  };

  // 🎵 Mic Audio Visualizer (Waveform dikhane ke liye)
  const startVisualizer = async () => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Mobile pe mic locking problem aati hai, toh wahan hum fake animation chalate hain
    if (isMobileDevice) {
      if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = setInterval(() => {
        const isActive = isListeningRef.current && !activeVoiceMessageIdRef.current;
        const v1 = isActive ? 0.3 + Math.random() * 0.7 : 0;
        const v2 = isActive ? 0.3 + Math.random() * 0.7 : 0;
        const v3 = isActive ? 0.3 + Math.random() * 0.7 : 0;
        if (pillRef?.current) {
          pillRef.current.style.setProperty("--v1", v1);
          pillRef.current.style.setProperty("--v2", v2);
          pillRef.current.style.setProperty("--v3", v3);
        }
        if (orbRef?.current) {
          orbRef.current.style.setProperty("--v1", v1);
          orbRef.current.style.setProperty("--v2", v2);
          orbRef.current.style.setProperty("--v3", v3);
        }
      }, 120);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const isActive = isListeningRef.current && !activeVoiceMessageIdRef.current;

        const v1 = isActive ? Math.min(dataArrayRef.current[2] / 50, 1.5) : 0;
        const v2 = isActive ? Math.min(dataArrayRef.current[8] / 50, 1.5) : 0;
        const v3 = isActive ? Math.min(dataArrayRef.current[15] / 50, 1.5) : 0;

        if (pillRef?.current) {
          pillRef.current.style.setProperty("--v1", v1);
          pillRef.current.style.setProperty("--v2", v2);
          pillRef.current.style.setProperty("--v3", v3);
        }
        if (orbRef?.current) {
          orbRef.current.style.setProperty("--v1", v1);
          orbRef.current.style.setProperty("--v2", v2);
          orbRef.current.style.setProperty("--v3", v3);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error("Visualizer failed:", err);
    }
  };

  const stopVisualizer = () => {
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) {
      sourceRef.current.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    setMicVolume(0);
    analyserRef.current = null;
  };

  // Sab kuch band karne ka master function
  const stopVoiceMode = () => {
    if (!isVoiceModeRef.current && !isDictatingRef.current) return;
    
    isVoiceModeRef.current = false;
    isListeningRef.current = false;
    isDictatingRef.current = false;
    
    setIsVoiceMode(false);
    setIsListening(false);
    setIsDictating(false);
    
    updateActiveVoiceMessageId(null);
    setCurrentSpokenWordIndex(-1);
    
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch (e) {}
    }
    
    stopVisualizer();
    window.speechSynthesis.cancel();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const startVoiceModeConfirm = async () => {
    // Keyboard hatao mobile me
    if (textareaRef?.current) textareaRef.current.blur();
    window.scrollTo(0, 0);

    setShowVoiceBetaModal(false);
    localStorage.setItem("hasAcceptedVoiceBeta", "true");
    
    if (!SpeechRecognition) {
      if (triggerVoiceToast) triggerVoiceToast({ message: "Speech recognition is not supported in your browser.", type: "error" });
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    bindRecognitionHandlers(rec);

    try {
      rec.start();
      setIsListening(true);
      isListeningRef.current = true;

      await startVisualizer();

      setIsVoiceMode(true);
      isVoiceModeRef.current = true;

      const isMobileDevice = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobileDevice && triggerVoiceToast) {
        triggerVoiceToast({ message: "Mobile browsers may restrict voice accuracy. Try desktop Chrome for a seamless experience!", type: "warning" });
      }

      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error("Voice Mode start failed:", err);
      try { rec.stop(); } catch (e) {}
      setIsListening(false);
      isListeningRef.current = false;
      if (triggerVoiceToast) {
        if (err.name === "NotAllowedError" || err.name === "SecurityError") {
          triggerVoiceToast({ message: "Microphone access denied. Please allow permissions in your browser.", type: "warning" });
        } else {
          triggerVoiceToast({ message: "Microphone error. Please check hardware.", type: "error" });
        }
      }
    }
  };

  const toggleVoiceMode = () => {
    if (!SpeechRecognition) {
      if (triggerVoiceToast) triggerVoiceToast({ message: "Speech recognition is not supported in your browser.", type: "error" });
      return;
    }
    if (isVoiceMode) {
      stopVoiceMode();
    } else {
      if (textareaRef?.current) textareaRef.current.blur();
      window.scrollTo(0, 0);

      const hasAccepted = localStorage.getItem("hasAcceptedVoiceBeta") === "true";
      if (hasAccepted) {
        startVoiceModeConfirm();
      } else {
        setShowVoiceBetaModal(true);
      }
    }
  };

  const stopSpeakMessage = () => {
    if (fallbackHighlightTimerRef.current) clearInterval(fallbackHighlightTimerRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    updateActiveVoiceMessageId(null);
    setCurrentSpokenWordIndex(-1);
  };

  const speakMessage = (text, messageId) => {
    if (!("speechSynthesis" in window)) return null;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    const premiumVoice =
      voices.find(v => v.name.includes("Neural") || v.name.includes("Enhanced") || v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Premium")) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0];

    if (premiumVoice) utterance.voice = premiumVoice;
    utterance.rate = 1.0;
    utterance.pitch = 0.98;
    utterance.volume = 1.0;

    if (messageId) {
      updateActiveVoiceMessageId(messageId);
      setCurrentSpokenWordIndex(-1);

      let boundaryFired = false;
      const wordsCount = text.trim().split(/\s+/).length;

      utterance.onstart = () => {
        let simulatedIndex = 0;
        if (fallbackHighlightTimerRef.current) clearInterval(fallbackHighlightTimerRef.current);
        
        fallbackHighlightTimerRef.current = setInterval(() => {
          if (boundaryFired) {
            clearInterval(fallbackHighlightTimerRef.current);
            return;
          }
          if (simulatedIndex < wordsCount) {
            setCurrentSpokenWordIndex(simulatedIndex);
            simulatedIndex++;
          }
        }, 330); // ~180 words per minute fallback speed
      };

      utterance.onboundary = (event) => {
        boundaryFired = true;
        if (fallbackHighlightTimerRef.current) clearInterval(fallbackHighlightTimerRef.current);
        
        const textUpToBoundary = text.substring(0, event.charIndex);
        const words = textUpToBoundary.trim().split(/\s+/);
        const wordIndex = textUpToBoundary.trim() === "" ? 0 : words.length;
        setCurrentSpokenWordIndex(wordIndex);
      };

      utterance.onend = () => {
        if (fallbackHighlightTimerRef.current) clearInterval(fallbackHighlightTimerRef.current);
        updateActiveVoiceMessageId(null);
        setCurrentSpokenWordIndex(-1);
      };

      utterance.onerror = () => {
        if (fallbackHighlightTimerRef.current) clearInterval(fallbackHighlightTimerRef.current);
        updateActiveVoiceMessageId(null);
        setCurrentSpokenWordIndex(-1);
      };
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  };

  // AI Stream hone ke time queue process karne ka loop
  const processSpeechQueue = (messageId) => {
    if (!isVoiceModeRef.current) {
      speechQueueRef.current = [];
      isSpeakingChunkRef.current = false;
      return;
    }

    if (speechQueueRef.current.length === 0) {
      isSpeakingChunkRef.current = false;
      if (isVoiceModeRef.current && !isStreamingRef.current) {
        updateActiveVoiceMessageId(null);
        startListeningSession(); // AI done, turn mic on
      }
      return;
    }

    isSpeakingChunkRef.current = true;
    const rawSentence = speechQueueRef.current.shift();
    const sentence = stripMarkdown(rawSentence).trim();

    if (!sentence) {
      isSpeakingChunkRef.current = false;
      processSpeechQueue(messageId);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    const voices = typeof window !== "undefined" && window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    const premiumVoice =
      voices.length > 0
        ? voices.find(v => v.name.includes("Neural") || v.name.includes("Enhanced") || v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Premium")) ||
          voices.find(v => v.lang.startsWith("en")) ||
          voices[0]
        : null;

    if (premiumVoice) utterance.voice = premiumVoice;
    utterance.rate = 1.0;
    utterance.pitch = 0.98;

    const wordOffset = totalWordsSpokenRef.current;
    const wordCount = sentence.trim().split(/\s+/).length;
    updateActiveVoiceMessageId(messageId);

    // Watchdog Timer (To fix browser freeze bugs on iOS Safari)
    const maxSpeechDurationMs = (wordCount / 2.5) * 1000 + 6000;
    let watchdogTimer = setTimeout(() => {
      console.warn("SpeechSynthesis watchdog fired: recovering frozen voice synthesis.");
      cleanupAndProcessNext();
    }, maxSpeechDurationMs);

    let onBoundaryFired = false;
    let fallbackInterval = null;

    const cleanupAndProcessNext = () => {
      if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
      if (fallbackInterval) { clearInterval(fallbackInterval); fallbackInterval = null; }
      utterance.onstart = null;
      utterance.onboundary = null;
      utterance.onend = null;
      utterance.onerror = null;
      totalWordsSpokenRef.current += wordCount;
      processSpeechQueue(messageId);
    };

    utterance.onstart = () => {
      setTimeout(() => {
        if (!onBoundaryFired && isSpeakingChunkRef.current) {
          const words = sentence.trim().split(/\s+/);
          let currentWordIdx = 0;
          const msPerWord = 1000 / 2.7;

          if (fallbackInterval) clearInterval(fallbackInterval);
          fallbackInterval = setInterval(() => {
            if (!isSpeakingChunkRef.current) {
              clearInterval(fallbackInterval);
              fallbackInterval = null;
              return;
            }
            if (currentWordIdx < words.length) {
              setCurrentSpokenWordIndex(wordOffset + currentWordIdx);
              currentWordIdx++;
            } else {
              clearInterval(fallbackInterval);
              fallbackInterval = null;
            }
          }, msPerWord);
        }
      }, 400);
    };

    utterance.onboundary = (event) => {
      onBoundaryFired = true;
      if (fallbackInterval) { clearInterval(fallbackInterval); fallbackInterval = null; }
      if (event.name === "word") {
        const textUpToChar = sentence.substring(0, event.charIndex);
        const wordsInChunk = textUpToChar.trim() ? textUpToChar.trim().split(/\s+/).length : 0;
        setCurrentSpokenWordIndex(wordOffset + wordsInChunk);
      }
    };

    utterance.onend = () => cleanupAndProcessNext();
    utterance.onerror = (e) => {
      if (e.error !== "interrupted") console.error("SpeechSynthesis error:", e);
      cleanupAndProcessNext();
    };

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.speak(utterance);
    } else {
      cleanupAndProcessNext();
    }
  };

  return {
    isVoiceMode,
    isListening,
    isDictating,
    activeVoiceMessageId,
    currentSpokenWordIndex,
    micVolume,
    recognitionRef,
    isListeningRef,
    isVoiceModeRef,
    speechQueueRef,
    isSpeakingChunkRef,
    totalWordsSpokenRef,
    toggleDictation,
    startVoiceModeConfirm,
    toggleVoiceMode,
    stopSpeakMessage,
    speakMessage,
    processSpeechQueue,
    startListeningSession,
    stopVoiceMode,
    updateActiveVoiceMessageId
  };
};
