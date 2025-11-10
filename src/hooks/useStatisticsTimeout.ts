import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const STATISTICS_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export const useStatisticsTimeout = () => {
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const clearStatsAccess = () => {
    sessionStorage.removeItem('stats_unlocked');
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      clearStatsAccess();
    }, STATISTICS_TIMEOUT);
  };

  const debouncedResetTimer = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      resetTimer();
    }, 1000);
  };

  useEffect(() => {
    // Only activate on statistics page
    if (location.pathname !== '/taken-analyse') {
      clearStatsAccess();
      return;
    }

    const events = ['mousedown', 'keypress', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, debouncedResetTimer);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, debouncedResetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      clearStatsAccess();
    };
  }, [location.pathname]);
};
