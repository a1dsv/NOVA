import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, TrendingUp, PlayCircle, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RunUI({ workout, onUpdate, onFinish }) {
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [targetPace, setTargetPace] = useState(6); // min/km
  const [ghostDistance, setGhostDistance] = useState(0);
  const [mode, setMode] = useState(workout.endurance_mode || 'run'); // run or interval

  // Interval mode state
  const [intervalPhase, setIntervalPhase] = useState('work'); // work or rest
  const [intervalTime, setIntervalTime] = useState(30);
  const [workTime] = useState(30);
  const [restTime] = useState(30);

  // Timer
  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Interval Timer
  useEffect(() => {
    let interval;
    if (isActive && mode === 'interval') {
      interval = setInterval(() => {
        setIntervalTime(prev => {
          if (prev <= 1) {
            // Switch phase
            if (intervalPhase === 'work') {
              setIntervalPhase('rest');
              if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
              return restTime;
            } else {
              setIntervalPhase('work');
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVK3n77BdGAg+ltryxnMpBSh+zPLaizsIGWS57OScTgwOUKvm8LRiHwU7k9jyyXUrBSh7yfDckEAKFF6z6eunVRQLRp7h8r9vIgU0h9H0z4IzBR5twPDjmEgNDlSs5/CwXhgIPZPb88h0KgUoffH02IY7CBlluurjm04MDk+s5/CxYB8FOZTb88p2KgUofM/13Ik8Bxtnv/DgmkoNDlSq5vCxYB8FOJTb88p3KwUofcvy14k7CBtle+rimlAMDlCp5fCxYB8FOZTa9Mp3KwUofc3y1ok7Bxtnv+/hmUoNDlSq5vCxYB8FOZTY88p3KwUofcvy14k7Bxtnv+/hmUoND1Sq5vCxYB8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSr5vCxYB8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSq5fCxYR8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSq5fCxYR8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSq5fCxYR8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSq5fCxYR8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSq5fCxYR8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSq5fCxYR8FOZTa88p3KwUofc3y1ok7CBhlv+/gmUoNDlSq5fCxYR8FOZTa88p3KwUofc3y1ok7CBhl');
              audio.play();
              return workTime;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, mode, intervalPhase, workTime, restTime]);

  // GPS Tracking (simplified)
  useEffect(() => {
    if (isActive && mode === 'run' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          const speedKmH = (position.coords.speed || 0) * 3.6;
          setDistance(prev => prev + (speedKmH / 3600));
        },
        null,
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isActive, mode]);

  // Ghost Runner
  useEffect(() => {
    let interval;
    if (isActive && mode === 'run') {
      interval = setInterval(() => {
        setGhostDistance(prev => prev + (1 / (targetPace * 60)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, mode, targetPace]);

  const currentPace = distance > 0 ? (elapsed / 60) / distance : 0;
  const isPacing = currentPace <= targetPace * 1.1;
  const bgColor = mode === 'interval' 
    ? (intervalPhase === 'work' ? 'from-red-500/20 to-orange-500/20' : 'from-blue-500/20 to-cyan-500/20')
    : (isPacing ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-orange-500/20');

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace || !isFinite(pace)) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgColor} transition-all duration-500`}>
      <div className="max-w-lg mx-auto p-6">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setMode('run')}
            className={mode === 'run' ? 'flex-1 bg-green-500/30 border-green-500/50' : 'flex-1 bg-white/10'}
          >
            GPS Run
          </Button>
          <Button
            onClick={() => setMode('interval')}
            className={mode === 'interval' ? 'flex-1 bg-orange-500/30 border-orange-500/50' : 'flex-1 bg-white/10'}
          >
            Intervals
          </Button>
        </div>

        {mode === 'run' ? (
          <>
            {/* Run Mode */}
            <div className="text-center space-y-2 mb-8">
              <div className="text-white/60 text-sm uppercase tracking-wider">Time</div>
              <div className="text-white text-6xl font-bold">
                {formatTime(elapsed)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
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

            {/* Ghost Runner */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-white text-sm font-medium">You</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-white text-sm font-medium">Target</span>
                </div>
              </div>
              
              <div className="relative h-4 bg-black/40 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-cyan-500/50"
                  style={{ width: `${Math.min((distance / (ghostDistance || 0.01)) * 100, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-xs">
                <span className={distance >= ghostDistance ? 'text-green-400' : 'text-red-400'}>
                  {distance >= ghostDistance ? '+' : ''}{(distance - ghostDistance).toFixed(2)}km
                </span>
                <Badge className={isPacing ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {isPacing ? 'On Pace' : 'Behind'}
                </Badge>
              </div>
            </div>

            {location && (
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 mb-6 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-white/60 text-sm">GPS Active</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Interval Mode */}
            <div className="text-center mb-8">
              <Badge className={intervalPhase === 'work' ? 'bg-red-500/20 text-red-400 text-lg px-4 py-2' : 'bg-cyan-500/20 text-cyan-400 text-lg px-4 py-2'}>
                {intervalPhase === 'work' ? 'WORK' : 'REST'}
              </Badge>
            </div>

            <div className="text-center mb-8">
              <div className="text-white text-[120px] font-bold leading-none">
                {intervalTime}
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-6 text-center">
              <p className="text-white/60 text-sm">Total Time</p>
              <p className="text-white text-2xl font-bold">{formatTime(elapsed)}</p>
            </div>
          </>
        )}

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setIsActive(!isActive)}
            className="flex-1 h-16 bg-white/10 hover:bg-white/20 text-white font-bold text-lg"
          >
            {isActive ? (
              <><PauseCircle className="w-6 h-6 mr-2" />Pause</>
            ) : (
              <><PlayCircle className="w-6 h-6 mr-2" />Start</>
            )}
          </Button>
        </div>

        <Button
          onClick={onFinish}
          className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg"
        >
          Finish Run
        </Button>
      </div>
    </div>
  );
}