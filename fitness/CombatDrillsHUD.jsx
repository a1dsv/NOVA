import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, VolumeX, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CombatDrillsHUD({ workout, onUpdate, onFinish }) {
  const [currentDrill, setCurrentDrill] = useState(0);
  const [roundTime, setRoundTime] = useState(180);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedDrills, setSelectedDrills] = useState([]);
  const [showDrillPicker, setShowDrillPicker] = useState(false);

  // Fetch combat drills from library
  const { data: allDrills = [] } = useQuery({
    queryKey: ['combat-drills'],
    queryFn: async () => {
      const drills = await base44.entities.ExerciseLibrary.filter({ type: 'combat' });
      return drills;
    }
  });

  // Timer
  useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Round complete
            if (currentDrill < selectedDrills.length - 1) {
              setCurrentDrill(prev => prev + 1);
              announceTransition(selectedDrills[currentDrill + 1]);
              return roundTime;
            } else {
              setIsActive(false);
              return 0;
            }
          }
          // Countdown cues
          if (prev === 10 && voiceEnabled) {
            speak('Ten seconds');
          } else if (prev === 3 && voiceEnabled) {
            speak('Three, two, one');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, currentDrill, selectedDrills, roundTime, voiceEnabled]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const announceTransition = (drill) => {
    if (voiceEnabled && drill) {
      speak(`Next drill: ${drill.title}`);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDrillToggle = (drill) => {
    const exists = selectedDrills.find(d => d.id === drill.id);
    if (exists) {
      setSelectedDrills(selectedDrills.filter(d => d.id !== drill.id));
    } else {
      setSelectedDrills([...selectedDrills, drill]);
    }
  };

  const currentDrillData = selectedDrills[currentDrill];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500/20 to-pink-500/20">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        {/* Voice Toggle */}
        <div className="flex justify-end">
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            size="icon"
            variant="ghost"
            className={voiceEnabled ? 'text-cyan-400' : 'text-white/40'}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {selectedDrills.length === 0 ? (
          <div className="text-center space-y-6 pt-20">
            <div className="text-white/60">No drills selected</div>
            <Button
              onClick={() => setShowDrillPicker(true)}
              className="nova-gradient h-14 px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Drills
            </Button>
          </div>
        ) : (
          <>
            {/* Current Drill */}
            <div className="text-center space-y-4">
              <div className="text-white/60 text-sm uppercase tracking-wider">
                Drill {currentDrill + 1} of {selectedDrills.length}
              </div>
              <motion.h2
                key={currentDrill}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-3xl font-bold"
              >
                {currentDrillData?.title}
              </motion.h2>
              
              {currentDrillData?.description && (
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  {currentDrillData.description}
                </p>
              )}

              <div className="flex gap-2 justify-center flex-wrap">
                <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                  {currentDrillData?.category}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {currentDrillData?.equipment}
                </Badge>
              </div>
            </div>

            {/* Timer */}
            <motion.div
              className="text-center py-8"
              animate={{ scale: timeLeft <= 3 && isActive ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: timeLeft <= 3 ? Infinity : 0, duration: 1 }}
            >
              <div className="text-white text-[100px] font-bold leading-none">
                {formatTime(timeLeft)}
              </div>
            </motion.div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setIsActive(!isActive)}
                size="icon"
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20"
              >
                {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </Button>
              
              <Button
                onClick={() => {
                  if (currentDrill < selectedDrills.length - 1) {
                    setCurrentDrill(prev => prev + 1);
                    setTimeLeft(roundTime);
                    announceTransition(selectedDrills[currentDrill + 1]);
                  }
                }}
                size="icon"
                disabled={currentDrill >= selectedDrills.length - 1}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30"
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            {/* Drill Queue */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-white/60 text-xs uppercase mb-3">Upcoming Drills</div>
              <div className="space-y-2">
                {selectedDrills.slice(currentDrill + 1, currentDrill + 4).map((drill, idx) => (
                  <div key={drill.id} className="flex items-center gap-2 text-white/40 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                      {currentDrill + idx + 2}
                    </div>
                    {drill.title}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Drill Picker Modal */}
        <AnimatePresence>
          {showDrillPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 overflow-y-auto p-6"
            >
              <div className="max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-xl">Select Drills</h3>
                  <Button
                    onClick={() => setShowDrillPicker(false)}
                    variant="ghost"
                    className="text-white/60"
                  >
                    Done
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {allDrills.map(drill => {
                    const isSelected = selectedDrills.find(d => d.id === drill.id);
                    return (
                      <button
                        key={drill.id}
                        onClick={() => handleDrillToggle(drill)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-purple-500/20 border-purple-500/40' 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="text-white font-medium mb-1">{drill.title}</div>
                        <div className="text-white/40 text-xs">{drill.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finish Button */}
        {selectedDrills.length > 0 && (
          <Button
            onClick={onFinish}
            className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold"
          >
            Finish Session
          </Button>
        )}
      </div>
    </div>
  );
}