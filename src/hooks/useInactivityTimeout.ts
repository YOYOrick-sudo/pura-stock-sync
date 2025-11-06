import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useInactivityTimeout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut();
        toast.info('Je bent automatisch uitgelogd vanwege inactiviteit');
        navigate('/');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }, INACTIVITY_TIMEOUT);
  };

  const debouncedResetTimer = () => {
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce to reduce overhead - only reset after 1 second of no events
    debounceRef.current = setTimeout(() => {
      resetTimer();
    }, 1000);
  };

  useEffect(() => {
    // Events that indicate user activity - reduced list for better performance
    const events = ['mousedown', 'keypress', 'touchstart', 'click'];

    // Add event listeners with debounced handler
    events.forEach(event => {
      document.addEventListener(event, debouncedResetTimer);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
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
    };
  }, []);
};
