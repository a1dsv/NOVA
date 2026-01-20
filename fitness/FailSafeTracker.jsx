import React, { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function FailSafeTracker({ workout, onRecover }) {
  const saveIntervalRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Auto-save to localStorage every 5 seconds
  useEffect(() => {
    if (!workout) return;

    const saveState = () => {
      const state = {
        workoutId: workout.id,
        exercises: workout.exercises,
        startedAt: workout.started_at,
        condition: workout.condition,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('active_session_state', JSON.stringify(state));
    };

    // Save immediately
    saveState();

    // Then save every 5 seconds
    saveIntervalRef.current = setInterval(saveState, 5000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [workout]);

  // Check for recovery on mount
  useEffect(() => {
    const savedState = localStorage.getItem('active_session_state');
    if (savedState && !workout) {
      const state = JSON.parse(savedState);
      const lastSaved = new Date(state.lastSaved);
      const now = new Date();
      const minutesAgo = (now - lastSaved) / 1000 / 60;

      // If session was saved within last 2 hours, offer recovery
      if (minutesAgo < 120) {
        onRecover?.(state);
      } else {
        // Too old, clear it
        localStorage.removeItem('active_session_state');
      }
    }
  }, []);

  // Clear on session end
  useEffect(() => {
    if (workout?.status === 'finished') {
      localStorage.removeItem('active_session_state');
    }
  }, [workout?.status]);

  // Screen Wake Lock
  useEffect(() => {
    if (!workout || workout.status !== 'active') return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock active');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [workout?.status]);

  // Visibility change - reacquire wake lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && workout?.status === 'active') {
        const requestWakeLock = async () => {
          try {
            if ('wakeLock' in navigator) {
              wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
          } catch (err) {
            console.error('Wake Lock reacquire error:', err);
          }
        };
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [workout?.status]);

  return null; // This is a utility component with no UI
}