import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RunTrackerModule({ config, data, onUpdate, onFinish }) {
  const [isActive, setIsActive] = useState(data.isActive || false);
  const [distance, setDistance] = useState(data.distance || 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(data.elapsedSeconds || 0);
  const [countdown, setCountdown] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState(data.breadcrumbs || []);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const intervalRef = useRef(null);

  const startCountdown = () => {
    const isResuming = elapsedSeconds > 0;
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsActive(true);
          if (!isResuming) {
            setElapsedSeconds(0);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const newElapsed = prev + 1;
        onUpdate({
          isActive,
          distance,
          elapsedSeconds: newElapsed,
          breadcrumbs
        });
        return newElapsed;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, distance, breadcrumbs]);

  useEffect(() => {
    if (isActive && 'geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          
          setCurrentSpeed(speed || 0);
          
          setBreadcrumbs(prev => {
            const newCrumb = { lat: latitude, lon: longitude, timestamp: Date.now() };
            const updated = [...prev, newCrumb];
            
            if (prev.length > 0) {
              const lastCrumb = prev[prev.length - 1];
              const dist = calculateDistance(
                lastCrumb.lat, lastCrumb.lon,
                latitude, longitude
              );
              
              setDistance(prevDist => prevDist + dist);
            }
            
            return updated;
          });
        },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      
      setWatchId(id);
      
      return () => {
        if (id) navigator.geolocation.clearWatch(id);
      };
    }
  }, [isActive]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pace = elapsedSeconds > 0 && distance > 0 
    ? (elapsedSeconds / 60) / distance 
    : 0;

  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        {countdown === 0 && (
          <motion.div
            className="absolute inset-0 bg-cyan-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.4 }}
          />
        )}
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className={`font-black font-mono ${countdown === 0 ? 'text-cyan-400' : 'text-white'}`}
          style={{ 
            fontSize: 'clamp(150px, 30vw, 300px)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: countdown === 0 
              ? '0 0 40px rgba(6, 182, 212, 1), 0 0 80px rgba(6, 182, 212, 0.6)'
              : '0 0 30px rgba(255, 255, 255, 0.8)'
          }}
        >
          {countdown === 0 ? 'GO!' : countdown}
        </motion.div>
        {elapsedSeconds > 0 && (
          <div className="absolute bottom-32 text-white/40 font-mono text-sm">
            Resuming at {formatTime(elapsedSeconds)} • {distance.toFixed(2)} km
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent opacity-30" />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="text-cyan-400 text-sm font-bold mb-2 uppercase tracking-wider">
          Running
        </div>

        <div className="text-white font-black text-7xl mb-8 font-mono" style={{ 
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 0 20px rgba(255, 255, 255, 0.6)'
        }}>
          {formatTime(elapsedSeconds)}
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-md">
          <div className="text-center">
            <div className="text-white/60 text-sm mb-2">Distance</div>
            <div className="text-white text-4xl font-bold">
              {distance.toFixed(2)}
            </div>
            <div className="text-white/60 text-sm mt-1">km</div>
          </div>

          <div className="text-center">
            <div className="text-white/60 text-sm mb-2">Pace</div>
            <div className="text-white text-4xl font-bold">
              {pace > 0 ? pace.toFixed(1) : '--'}
            </div>
            <div className="text-white/60 text-sm mt-1">min/km</div>
          </div>
        </div>

        {isActive && (
          <div className="mt-8 flex items-center gap-2 text-green-400">
            <MapPin className="w-5 h-5 animate-pulse" />
            <span className="text-sm">GPS Active</span>
          </div>
        )}
      </div>

      <div className="p-6 pb-48 space-y-4 relative z-10">
        <Button
          onClick={() => {
            if (isActive) {
              setIsActive(false);
            } else {
              startCountdown();
            }
          }}
          size="lg"
          className="w-full h-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-xl"
        >
          {isActive ? 'PAUSE' : 'START'}
        </Button>


      </div>
    </div>
  );
}