import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function CombatTimer({ workout, onUpdate, onFinish }) {
  const [currentRound, setCurrentRound] = useState(workout.current_round || 1);
  const [timeLeft, setTimeLeft] = useState(workout.time_left || (workout.round_duration || 180));
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(workout.is_resting || false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognition, setRecognition] = useState(null);
  const [showIntensityScore, setShowIntensityScore] = useState(false);
  const [intensityScores, setIntensityScores] = useState(workout.intensity_scores || {});
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const cameraInputRef = useRef(null);
  const audioContextRef = useRef(null);

  const totalRounds = workout.total_rounds || 5;
  const roundDuration = workout.round_duration || 180;
  const restDuration = workout.rest_duration || 60;
  const currentDrill = workout.exercises?.[currentRound - 1]?.name || 'Combat Training';

  // Initialize Web Audio API
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Boxing bell sound
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

    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
  };

  // 3-second beep
  const playBeep = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 1200;
    gainNode.gain.value = 0.3;
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  };

  // Voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;

      recog.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        if (transcript.includes('start round')) {
          setIsActive(true);
        } else if (transcript.includes('pause')) {
          setIsActive(false);
        } else if (transcript.includes('end session')) {
          handleEndSession();
        }
      };

      setRecognition(recog);
    }
  }, []);

  useEffect(() => {
    if (voiceEnabled && recognition) {
      try {
        recognition.start();
      } catch (e) {}
    } else if (recognition) {
      recognition.stop();
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [voiceEnabled, recognition]);

  // High-precision timer with localStorage persistence
  useEffect(() => {
    let rafId;
    let lastTimestamp = Date.now();

    const tick = () => {
      if (isActive) {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - lastTimestamp) / 1000);
        
        if (deltaSeconds >= 1) {
          lastTimestamp = now;
          
          setTimeLeft(prev => {
            const newTime = prev - 1;
            
            // Save to localStorage every second
            const timerState = {
              current_round: currentRound,
              time_left: newTime,
              is_resting: isResting,
              intensity_scores: intensityScores,
              timestamp: Date.now()
            };
            localStorage.setItem('combat_timer_state', JSON.stringify(timerState));
            onUpdate({ ...workout, ...timerState });

            // Audio cues
            if (!isResting && newTime === 10) {
              playBeep();
            } else if (!isResting && newTime <= 3 && newTime > 0) {
              playBeep();
            }

            // Round/Rest transitions
            if (newTime <= 0) {
              if (isResting) {
                // Rest ended, start next round
                playBell();
                setIsResting(false);
                setCurrentRound(prev => prev + 1);
                return roundDuration;
              } else {
                // Round ended
                playBell();
                setIsActive(false);
                setShowIntensityScore(true);
                
                if (currentRound >= totalRounds) {
                  // All rounds complete
                  return 0;
                } else {
                  setIsResting(true);
                  return restDuration;
                }
              }
            }

            return newTime;
          });
        }
      }
      
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isActive, timeLeft, isResting, currentRound, intensityScores]);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('combat_timer_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const age = Date.now() - state.timestamp;
        
        if (age < 2 * 60 * 60 * 1000 && state.current_round) {
          setCurrentRound(state.current_round);
          setTimeLeft(state.time_left);
          setIsResting(state.is_resting);
          setIntensityScores(state.intensity_scores || {});
        }
      } catch (e) {}
    }
  }, []);

  const handleIntensityScore = (score) => {
    const newScores = {
      ...intensityScores,
      [currentRound]: score
    };
    setIntensityScores(newScores);
    setShowIntensityScore(false);
    
    if (currentRound >= totalRounds) {
      handleEndSession();
    } else {
      setIsActive(true);
    }
  };

  const handleEndSession = () => {
    setShowPhotoCapture(true);
  };

  const handlePhotoCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      completeSession();
      return;
    }

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const finishedAt = new Date().toISOString();
      const startedAt = new Date(workout.started_at || workout.created_date);
      const durationMinutes = Math.round((new Date(finishedAt) - startedAt) / 60000);

      await base44.entities.Workout.update(workout.id, {
        status: 'finished',
        finished_at: finishedAt,
        duration_minutes: durationMinutes,
        total_rounds: totalRounds,
        intensity_scores: intensityScores,
        proof_photo_url: file_url
      });

      localStorage.removeItem('combat_timer_state');
      localStorage.removeItem('nova_backup_session');
      onFinish();
    } catch (error) {
      completeSession();
    }
  };

  const completeSession = async () => {
    const finishedAt = new Date().toISOString();
    const startedAt = new Date(workout.started_at || workout.created_date);
    const durationMinutes = Math.round((new Date(finishedAt) - startedAt) / 60000);

    await base44.entities.Workout.update(workout.id, {
      status: 'finished',
      finished_at: finishedAt,
      duration_minutes: durationMinutes,
      total_rounds: totalRounds,
      intensity_scores: intensityScores
    });

    localStorage.removeItem('combat_timer_state');
    localStorage.removeItem('nova_backup_session');
    onFinish();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bgColor = isResting 
    ? 'from-green-600/40 to-emerald-600/40' 
    : 'from-zinc-900 to-black';

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-b ${bgColor} transition-all duration-1000 flex flex-col`}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <Button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          size="icon"
          variant="ghost"
          className={voiceEnabled ? 'text-green-400' : 'text-white/40'}
        >
          {voiceEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        <div className="text-center">
          <div className="text-white/60 text-sm uppercase tracking-widest">
            {workout.template_name || 'Combat Session'}
          </div>
          <div className="text-white text-xl font-bold mt-1">
            Round {currentRound} / {totalRounds}
          </div>
        </div>

        <Button
          onClick={handleEndSession}
          size="icon"
          variant="ghost"
          className="text-white/60 hover:text-red-400"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Main HUD */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Giant Timer */}
        <motion.div
          className="text-center mb-8"
          animate={{ 
            scale: timeLeft <= 10 && isActive && !isResting ? [1, 1.05, 1] : 1,
          }}
          transition={{ 
            repeat: timeLeft <= 10 && !isResting ? Infinity : 0, 
            duration: 1 
          }}
        >
          <div 
            className="text-white font-bold leading-none"
            style={{ fontSize: 'clamp(120px, 25vw, 220px)' }}
          >
            {formatTime(timeLeft)}
          </div>
        </motion.div>

        {/* Drill Indicator */}
        <motion.div
          key={`${currentRound}-${isResting}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-white/60 text-sm uppercase tracking-wider mb-2">
            {isResting ? 'REST PERIOD' : 'FOCUS'}
          </div>
          <h2 className="text-white text-4xl font-bold uppercase tracking-wide">
            {isResting ? 'RECOVER' : currentDrill}
          </h2>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="p-6 pb-safe space-y-4">
        {voiceEnabled && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3">
            <div className="flex flex-wrap gap-2 justify-center text-xs text-white/40">
              <span>"Start Round"</span>
              <span>•</span>
              <span>"Pause"</span>
              <span>•</span>
              <span>"End Session"</span>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={() => setIsActive(!isActive)}
            size="icon"
            className="w-24 h-24 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            {isActive ? (
              <div className="w-10 h-10 bg-white rounded-sm" />
            ) : (
              <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-2" />
            )}
          </Button>
        </div>
      </div>

      {/* Intensity Score Modal */}
      <AnimatePresence>
        {showIntensityScore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-zinc-900 rounded-2xl p-8 max-w-lg w-full"
            >
              <h3 className="text-white font-bold text-3xl text-center mb-8">
                Round {currentRound} Intensity
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    onClick={() => handleIntensityScore(score)}
                    className="h-24 bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-cyan-400 text-white font-bold text-3xl flex-col"
                  >
                    {score}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-white/40 mt-4 px-2">
                <span>Easy</span>
                <span>Max Effort</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Capture Modal */}
      <AnimatePresence>
        {showPhotoCapture && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-white font-bold text-2xl text-center mb-6">
                Session Complete!
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Capture Photo Proof
                </Button>
                <Button
                  onClick={completeSession}
                  variant="outline"
                  className="w-full h-14 bg-white/5 border-white/10 text-white"
                >
                  Finish Without Photo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
      />
    </div>
  );
}