import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CombatTimerModule({ config, data, onUpdate, onFinish }) {
  const [currentRound, setCurrentRound] = useState(data.currentRound || 1);
  const [isActive, setIsActive] = useState(data.isActive || false);
  const [isResting, setIsResting] = useState(data.isResting || false);
  const [elapsedSeconds, setElapsedSeconds] = useState(data.elapsedSeconds || 0);
  const [countdown, setCountdown] = useState(null);
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  const totalRounds = config.rounds || 5;
  const roundDuration = config.roundDuration || 180;
  const restDuration = config.restDuration || 60;

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => audioContextRef.current?.close();
  }, []);

  const playBell = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
  };

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
        const duration = isResting ? restDuration : roundDuration;

        onUpdate({
          currentRound,
          isActive,
          isResting,
          elapsedSeconds: newElapsed,
          totalRounds
        });

        if (newElapsed >= duration) {
          if (isResting) {
            playBell();
            setIsResting(false);
            setCurrentRound(prev => prev + 1);
            setElapsedSeconds(0);
          } else if (currentRound < totalRounds) {
            playBell();
            setIsResting(true);
            setElapsedSeconds(0);
          } else {
            playBell();
            setIsActive(false);
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }

        return newElapsed >= duration ? 0 : newElapsed;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, currentRound, isResting]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bgColor = isResting 
    ? 'from-green-600 to-emerald-600' 
    : 'from-red-600 to-orange-600';

  const duration = isResting ? restDuration : roundDuration;
  const timeLeft = duration - elapsedSeconds;

  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        {countdown === 0 && (
          <motion.div
            className="absolute inset-0 bg-red-500/30"
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
          className={`font-black font-mono ${countdown === 0 ? 'text-green-400' : 'text-white'}`}
          style={{ 
            fontSize: 'clamp(150px, 30vw, 300px)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: countdown === 0 
              ? '0 0 40px rgba(16, 185, 129, 1), 0 0 80px rgba(16, 185, 129, 0.6)'
              : '0 0 30px rgba(255, 255, 255, 0.8)'
          }}
        >
          {countdown === 0 ? 'GO!' : countdown}
        </motion.div>
        {elapsedSeconds > 0 && (
          <div className="absolute bottom-32 text-white/40 font-mono text-sm">
            Resuming at {formatTime(timeLeft)} • Round {currentRound}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black transition-all duration-1000 flex flex-col">
      <div className={`absolute inset-0 bg-gradient-radial ${
        isResting 
          ? 'from-emerald-500/15 via-transparent to-transparent' 
          : 'from-red-500/15 via-transparent to-transparent'
      } opacity-40 transition-all duration-1000`} />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {config.roundFocus && config.roundFocus.find(r => r.round === currentRound)?.drill && (
          <div className="mb-3">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-1 text-center">Drill Focus</div>
            <div className="text-white font-bold text-xl text-center font-mono" style={{
              textShadow: isResting 
                ? '0 0 15px rgba(16, 185, 129, 0.5)'
                : '0 0 15px rgba(239, 68, 68, 0.5)'
            }}>
              {config.roundFocus.find(r => r.round === currentRound).drill.title}
            </div>
          </div>
        )}
        
        <div className="text-white/80 text-2xl font-bold mb-2">
          ROUND {currentRound} / {totalRounds}
        </div>

        <motion.div
          className="text-white font-black mb-8 font-mono"
          style={{ 
            fontSize: 'clamp(100px, 25vw, 200px)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: isResting 
              ? '0 0 30px rgba(16, 185, 129, 0.8), 0 0 60px rgba(16, 185, 129, 0.4)'
              : '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)'
          }}
          animate={{ 
            scale: timeLeft <= 10 && !isResting ? [1, 1.05, 1] : 1 
          }}
          transition={{ 
            repeat: timeLeft <= 10 && !isResting ? Infinity : 0, 
            duration: 1 
          }}
        >
          {formatTime(timeLeft)}
        </motion.div>

        <div className="text-white text-5xl font-bold uppercase" style={{
          textShadow: isResting 
            ? '0 0 20px rgba(16, 185, 129, 0.6)'
            : '0 0 20px rgba(239, 68, 68, 0.6)'
        }}>
          {isResting ? 'REST' : 'WORK'}
        </div>
      </div>

      <div className="p-6 pb-48 space-y-4 relative z-10">
        {currentRound < totalRounds || (currentRound === totalRounds && timeLeft > 0) ? (
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
        ) : (
          <>
            <Button
              onClick={() => {
                const newTotal = totalRounds + 1;
                setCurrentRound(newTotal);
                setIsResting(false);
                setElapsedSeconds(0);
                onUpdate({
                  currentRound: newTotal,
                  isActive: false,
                  isResting: false,
                  elapsedSeconds: 0,
                  totalRounds: newTotal
                });
                startCountdown();
              }}
              size="lg"
              className="w-full h-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-xl"
            >
              Add Another Round
            </Button>
            
            <Button
              onClick={onFinish}
              size="lg"
              variant="outline"
              className="w-full h-14 border-2 border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-400 font-bold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Finish Chapter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}