import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Mic, MicOff, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoundsTimerSetup from './RoundsTimerSetup';
import RoundsTimerHUD from './RoundsTimerHUD';

export default function CombatUI({ workout, onUpdate, onFinish }) {
  const [showRoundTimer, setShowRoundTimer] = useState(workout.protocol === 'combat_drills' || workout.protocol === 'rounds');
  const [roundTimerConfig, setRoundTimerConfig] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(workout.combat_rounds || 5);
  const [roundTime, setRoundTime] = useState(workout.combat_round_time || 180);
  const [timeLeft, setTimeLeft] = useState(roundTime);
  const [isActive, setIsActive] = useState(false);
  const [currentDrill, setCurrentDrill] = useState(workout.combat_focus || 'Combat Training');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition
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
          speak('Round started');
        } else if (transcript.includes('end round') || transcript.includes('stop round')) {
          handleRoundComplete();
        } else if (transcript.includes('pause')) {
          setIsActive(false);
          speak('Paused');
        }
      };
      
      setRecognition(recog);
    }
  }, []);

  useEffect(() => {
    if (voiceEnabled && recognition) {
      recognition.start();
    } else if (recognition) {
      recognition.stop();
    }
    
    return () => {
      if (recognition) recognition.stop();
    };
  }, [voiceEnabled, recognition]);

  // Timer
  useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleRoundComplete();
            return roundTime;
          }
          if (prev === 10 && voiceEnabled) speak('Ten seconds');
          if (prev === 3 && voiceEnabled) speak('Three, two, one');
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, roundTime, voiceEnabled]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRoundComplete = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(prev => prev + 1);
      setTimeLeft(roundTime);
      if (voiceEnabled) speak(`Round ${currentRound + 1}`);
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    } else {
      setIsActive(false);
      if (voiceEnabled) speak('Training complete');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Round Timer mode
  if (showRoundTimer && !roundTimerConfig) {
    return (
      <RoundsTimerSetup 
        onStart={(config) => setRoundTimerConfig(config)}
      />
    );
  }

  if (showRoundTimer && roundTimerConfig) {
    return (
      <RoundsTimerHUD
        config={roundTimerConfig}
        onFinish={(data) => {
          onFinish({
            ...workout,
            round_timer_data: data
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-500/20 to-orange-500/20">
      <div className="max-w-lg mx-auto p-6">
        {/* Mode Selection Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowRoundTimer(true)}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold"
          >
            <Timer className="w-5 h-5 mr-2" />
            Switch to Round Timer Mode
          </Button>
        </div>
        {/* Focus Label - Large and Readable */}
        <motion.div
          key={currentDrill}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-6"
        >
          <h1 className="text-white font-bold text-4xl leading-tight mb-2">
            {currentDrill}
          </h1>
          <p className="text-white/60 text-lg">Focus Drill</p>
        </motion.div>

        {/* Round Counter */}
        <div className="text-center mb-4">
          <div className="text-white/60 text-sm uppercase tracking-wider">
            Round {currentRound} of {totalRounds}
          </div>
        </div>

        {/* Giant Timer */}
        <motion.div
          className="text-center py-16"
          animate={{ scale: timeLeft <= 3 && isActive ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: timeLeft <= 3 ? Infinity : 0, duration: 1 }}
        >
          <div className="text-white text-[140px] font-bold leading-none tracking-tighter">
            {formatTime(timeLeft)}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            size="icon"
            className={`w-14 h-14 rounded-full ${
              voiceEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
            }`}
          >
            {voiceEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={() => setIsActive(!isActive)}
            size="icon"
            className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20"
          >
            {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
          </Button>

          <Button
            onClick={handleRoundComplete}
            size="icon"
            disabled={currentRound >= totalRounds}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30"
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>

        {/* Voice Command Hints */}
        {voiceEnabled && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-6">
            <p className="text-white/60 text-xs text-center mb-2">Voice Commands Active</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Start Round', 'End Round', 'Pause'].map(cmd => (
                <span key={cmd} className="px-2 py-1 rounded-lg bg-white/5 text-white/40 text-xs">
                  "{cmd}"
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={onFinish}
          className="w-full h-16 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg"
        >
          Finish Combat Session
        </Button>
      </div>
    </div>
  );
}