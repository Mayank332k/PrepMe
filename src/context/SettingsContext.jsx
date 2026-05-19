import React, { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [hintsEnabled, setHintsEnabled] = useState(() => {
    const val = localStorage.getItem('hintsEnabled');
    return val !== null ? val === 'true' : true;
  });

  const [hintsForVoice, setHintsForVoice] = useState(() => {
    const val = localStorage.getItem('hintsForVoice');
    return val !== null ? val === 'true' : true;
  });

  const [hintsForChat, setHintsForChat] = useState(() => {
    const val = localStorage.getItem('hintsForChat');
    return val !== null ? val === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('hintsEnabled', hintsEnabled);
  }, [hintsEnabled]);

  useEffect(() => {
    localStorage.setItem('hintsForVoice', hintsForVoice);
  }, [hintsForVoice]);

  useEffect(() => {
    localStorage.setItem('hintsForChat', hintsForChat);
  }, [hintsForChat]);

  return (
    <SettingsContext.Provider value={{
      hintsEnabled,
      setHintsEnabled,
      hintsForVoice,
      setHintsForVoice,
      hintsForChat,
      setHintsForChat
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
