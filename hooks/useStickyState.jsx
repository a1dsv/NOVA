import { useState, useEffect } from 'react';

export default function useStickyState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage:', e);
      localStorage.removeItem(key);
    }
    return defaultValue;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [key, value]);

  return [value, setValue];
}