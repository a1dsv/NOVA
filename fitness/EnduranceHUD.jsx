import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Activity, Target, Clock, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EnduranceHUD({ workout, onUpdate, onFinish }) {
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [location, setLocation] = useState(null);
  const [targetPace, setTargetPace] = useState(6); // min/km
  const [watchId, setWatchId] = useState(null);
  const [ghostDistance, setGhostDistance] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // GPS Tracking
  useEffect(() => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Calculate distance from previous point
          // Simplified: increment by speed estimation
          const speedKmH = (position.coords.speed || 0) * 3.6;
          setDistance(prev => prev + (speedKmH / 3600)); // per second
        },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setWatchId(id);
      return () => navigator.geolocation.clearWatch(id);
    }
  }, []);

  // Ghost Runner (perfect pace)
  useEffect(() => {
    const interval = setInterval(() => {
      setGhostDistance(prev => prev + (1 / (targetPace * 60))); // km per second
    }, 1000);
    return () => clearInterval(interval);
  }, [targetPace]);

  const currentPace = distance > 0 ? (elapsed / 60) / distance : 0;
  const isPacing = currentPace <= targetPace * 1.1;
  const bgColor = isPacing ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-orange-500/20';

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgColor} transition-all duration-500`}>
      <div className="max-w-lg mx-auto p-6 space-y-6">
        {/* Main Stats */}
        <div className="text-center space-y-2">
          <div className="text-white/60 text-sm uppercase tracking-wider">Time</div>
          <div className="text-white text-6xl font-bold tracking-tight">
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Distance & Pace Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-white/60 text-xs uppercase mb-1">Distance</div>
            <div className="text-white text-3xl font-bold">{distance.toFixed(2)}</div>
            <div className="text-white/40 text-xs">km</div>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-white/60 text-xs uppercase mb-1">Pace</div>
            <div className="text-white text-3xl font-bold">{formatPace(currentPace)}</div>
            <div className="text-white/40 text-xs">/km</div>
          </div>
        </div>

        {/* Ghost Runner Visualization */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span className="text-white text-sm font-medium">You</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-white text-sm font-medium">Target Pace</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-4 bg-black/40 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-cyan-500/50"
              style={{ width: `${Math.min((distance / (ghostDistance || 0.01)) * 100, 100)}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
            <motion.div
              className="absolute top-0 left-0 h-full w-1 bg-amber-400"
              style={{ left: `${Math.min((ghostDistance / (distance || 0.01)) * 100, 100)}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-white/50">
            <span>{distance > ghostDistance ? '+' : ''}{(distance - ghostDistance).toFixed(2)}km</span>
            <span>{isPacing ? 'On Pace' : 'Behind Pace'}</span>
          </div>
        </div>

        {/* Location */}
        {location && (
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-400" />
            <span className="text-white/60 text-sm">
              GPS Active • {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            onClick={onFinish}
            className="flex-1 h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold"
          >
            Finish Run
          </Button>
        </div>
      </div>
    </div>
  );
}