import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'auto',
  setMode: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 7;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('pv-theme');
    return (stored as ThemeMode) || 'auto';
  });

  const isDark = mode === 'dark' || (mode === 'auto' && isNightTime());

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('pv-theme', m);
  }, []);

  // Apply dark class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Re-check auto mode every minute
  useEffect(() => {
    if (mode !== 'auto') return;
    const interval = setInterval(() => {
      // Force re-render to check time
      setModeState('auto');
    }, 60000);
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
