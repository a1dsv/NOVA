import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoundsTimerHUD({ config, onFinish }) {
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(config.roundDuration);
  const [isActive, setIsActive] = useState(false);
  const [isRest, setIsRest] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognition, setRecognition] = useState(null);
  const [roundIntensities, setRoundIntensities] = useState({});
  const [showIntensityLog, setShowIntensityLog] = useState(false);
  const audioRef = useRef(null);

  // Initialize Speech Recognition
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
        } else if (transcript.includes('resume')) {
          setIsActive(true);
        } else if (transcript.includes('end session')) {
          handleEndSession();
        }
      };

      setRecognition(recog);
    }
  }, []);

  // Voice control toggle
  useEffect(() => {
    if (voiceEnabled && recognition) {
      try {
        recognition.start();
      } catch (e) {
        // Already started
      }
    } else if (recognition) {
      recognition.stop();
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [voiceEnabled, recognition]);

  // Timer logic with localStorage backup
  useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Save to localStorage every second
          localStorage.setItem('round_timer_state', JSON.stringify({
            currentRound,
            timeLeft: newTime,
            isRest,
            timestamp: Date.now()
          }));

          // Audio cues
          if (newTime === 10) {
            playBell();
            speak('Ten seconds');
          } else if (newTime === 3) {
            speak('Three, two, one');
          }

          // Round/Rest transitions
          if (newTime === 0) {
            if (isRest) {
              // Rest ended, start next round
              if (currentRound < config.numRounds) {
                playBell();
                speak(`Round ${currentRound + 1}`);
                setIsRest(false);
                setCurrentRound(prev => prev + 1);
                return config.roundDuration;
              } else {
                // All rounds complete
                handleEndSession();
                return 0;
              }
            } else {
              // Round ended, start rest or finish
              playBell();
              setShowIntensityLog(true);
              setIsActive(false);
              
              if (currentRound < config.numRounds) {
                setIsRest(true);
                return config.restDuration;
              } else {
                handleEndSession();
                return 0;
              }
            }
          }

          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isRest, currentRound, config]);

  // Session recovery on mount
  useEffect(() => {
    const saved = localStorage.getItem('round_timer_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const age = Date.now() - state.timestamp;
        
        if (age < 2 * 60 * 60 * 1000) { // Less than 2 hours old
          if (confirm('Resume your previous round timer session?')) {
            setCurrentRound(state.currentRound);
            setTimeLeft(state.timeLeft);
            setIsRest(state.isRest);
          } else {
            localStorage.removeItem('round_timer_state');
          }
        } else {
          localStorage.removeItem('round_timer_state');
        }
      } catch (e) {
        localStorage.removeItem('round_timer_state');
      }
    }
  }, []);

  const speak = (text) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playBell = () => {
    // Use a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  const handleIntensityLog = (intensity) => {
    const updatedIntensities = {
      ...roundIntensities,
      [currentRound]: intensity
    };
    setRoundIntensities(updatedIntensities);
    
    // HARD-SAVE to localStorage
    const timerState = {
      currentRound,
      timeLeft,
      isRest,
      roundIntensities: updatedIntensities,
      timestamp: Date.now()
    };
    localStorage.setItem('round_timer_state', JSON.stringify(timerState));
    
    setShowIntensityLog(false);
    
    if (currentRound < config.numRounds) {
      setIsActive(true);
    } else {
      handleEndSession();
    }
  };

  const handleEndSession = () => {
    localStorage.removeItem('round_timer_state');
    onFinish({
      roundIntensities,
      totalRounds: config.numRounds
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentFocus = config.roundFocuses[currentRound - 1] || 'Combat Training';
  const backgroundColor = isRest ? 'from-green-900/60 to-blue-900/60' : 'from-red-900/60 to-orange-900/60';

  return (
    <div className={`min-h-screen bg-gradient-to-b ${backgroundColor} transition-colors duration-1000`}>
      <div className="max-w-2xl mx-auto p-6 flex flex-col justify-between min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            size="icon"
            variant="ghost"
            className={voiceEnabled ? 'text-green-400' : 'text-white/40'}
          >
            {voiceEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          
          <div className="text-white/80 text-sm uppercase tracking-wider">
            Round {currentRound} / {config.numRounds}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
          {/* Giant Timer */}
          <motion.div
            className="text-center"
            animate={{ 
              scale: timeLeft <= 10 && isActive ? [1, 1.05, 1] : 1,
              color: timeLeft <= 10 ? '#ef4444' : '#ffffff'
            }}
            transition={{ 
              repeat: timeLeft <= 10 ? Infinity : 0, 
              duration: 1 
            }}
          >
            <div className="text-white text-[180px] font-bold leading-none tracking-tighter">
              {formatTime(timeLeft)}
            </div>
          </motion.div>

          {/* Current Focus */}
          <motion.div
            key={`${currentRound}-${isRest}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-white/60 text-sm uppercase mb-2">
              {isRest ? 'REST PERIOD' : 'FOCUS'}
            </div>
            <h2 className="text-white text-4xl font-bold uppercase tracking-wide">
              {isRest ? 'RECOVER' : currentFocus}
            </h2>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {voiceEnabled && !isRest && (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3">
              <div className="flex flex-wrap gap-2 justify-center text-xs text-white/40">
                <span>"Start Round"</span>
                <span>•</span>
                <span>"Pause"</span>
                <span>•</span>
                <span>"Resume"</span>
                <span>•</span>
                <span>"End Session"</span>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={() => setIsActive(!isActive)}
              size="icon"
              className="w-24 h-24 rounded-full bg-white/10 hover:bg-white/20"
            >
              {isActive ? 
                <Pause className="w-12 h-12" /> : 
                <Play className="w-12 h-12 ml-2" />
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Intensity Log Modal */}
      <AnimatePresence>
        {showIntensityLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-white font-bold text-2xl text-center mb-6">
                Round {currentRound} Intensity
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => handleIntensityLog('low')}
                  className="h-24 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/40 text-green-400 font-bold text-lg flex-col"
                >
                  <div className="text-3xl mb-1">😌</div>
                  LOW
                </Button>
                <Button
                  onClick={() => handleIntensityLog('mid')}
                  className="h-24 bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500/40 text-yellow-400 font-bold text-lg flex-col"
                >
                  <div className="text-3xl mb-1">😅</div>
                  MID
                </Button>
                <Button
                  onClick={() => handleIntensityLog('high')}
                  className="h-24 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/40 text-red-400 font-bold text-lg flex-col"
                >
                  <div className="text-3xl mb-1">🔥</div>
                  HIGH
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}