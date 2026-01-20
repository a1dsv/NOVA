import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, FileText, Save, Dumbbell, Swords, Flame, Snowflake, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TemplateSelector from './TemplateSelector';
import SavePreFlightTemplateModal from './SavePreFlightTemplateModal';
import ExerciseLibraryModal from './ExerciseLibraryModal';
import CombatDrillLibraryModal from './CombatDrillLibraryModal';
import StretchLibraryModal from './StretchLibraryModal';
import EnduranceLibraryModal from './EnduranceLibraryModal';
import AdaptiveCoachSuggestion from '@/components/coach/AdaptiveCoachSuggestion';
import NovaSmartLog from './NovaSmartLog';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function PreFlightWindow({ workoutType, onStart, onClose, user }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showDrillLibrary, setShowDrillLibrary] = useState(false);
  const [showStretchLibrary, setShowStretchLibrary] = useState(false);
  const [showEnduranceLibrary, setShowEnduranceLibrary] = useState(false);
  const [showSmartLogPreflight, setShowSmartLogPreflight] = useState(false);
  const [condition, setCondition] = useState('fresh');
  const [coachSuggestion, setCoachSuggestion] = useState(null);
  const [expandedDrill, setExpandedDrill] = useState(null);
  const [config, setConfig] = useState(() => {
    switch (workoutType.id) {
      case 'martial_arts':
        return {
          rounds: 5,
          roundDuration: 180,
          restDuration: 60,
          roundFocus: [
          { round: 1, focus: 'Jabs & Crosses', drill: null },
          { round: 2, focus: 'Kicks', drill: null },
          { round: 3, focus: 'Combos', drill: null },
          { round: 4, focus: 'Defense', drill: null },
          { round: 5, focus: 'Full Sparring', drill: null }]

        };
      case 'endurance':
        return {
          rounds: 5,
          workDuration: 120,
          restDuration: 60,
          roundFocus: [
            { round: 1, focus: '', exercise: null },
            { round: 2, focus: '', exercise: null },
            { round: 3, focus: '', exercise: null },
            { round: 4, focus: '', exercise: null },
            { round: 5, focus: '', exercise: null }
          ]
        };
      case 'strength':
        return {
          exercises: []
        };
      case 'recovery':
        return {
          mode: 'stretching',
          rounds: [],
          stretches: [],
          startWith: 'stretching'
        };
      default:
        return {};
    }
  });

  // Fetch today's workouts to check for conflicts
  const { data: todaysWorkouts = [] } = useQuery({
    queryKey: ['todays-workouts', user?.id],
    queryFn: async () => {
      const today = new Date().toDateString();
      const workouts = await base44.entities.Workout.filter({ user_id: user.id }, '-created_date', 20);
      return workouts.filter((w) => new Date(w.created_date).toDateString() === today);
    },
    enabled: !!user
  });

  const conditions = [
  { id: 'fresh', label: 'Fresh', emoji: '⚡', desc: 'Fully rested' },
  { id: 'tired', label: 'Tired', emoji: '😮‍💨', desc: 'Manageable fatigue' },
  { id: 'compromised', label: 'Weakened', emoji: '🤕', desc: 'Injury/pain present' }];


  // Auto-populate round strategy when rounds change
  useEffect(() => {
    if ((workoutType.id === 'martial_arts' || workoutType.id === 'endurance') && config.rounds !== undefined) {
      const currentRounds = config.roundFocus || [];
      const targetCount = config.rounds;

      if (currentRounds.length < targetCount) {
        // ADDITIVE ONLY: Append only new rounds, do not redefine existing ones
        const newRounds = [];
        for (let i = currentRounds.length; i < targetCount; i++) {
          if (workoutType.id === 'martial_arts') {
            newRounds.push({ round: i + 1, focus: '', drill: null });
          } else {
            newRounds.push({ round: i + 1, focus: '', exercise: null });
          }
        }
        setConfig((prev) => ({
          ...prev,
          roundFocus: [...(prev.roundFocus || []), ...newRounds]
        }));
      } else if (currentRounds.length > targetCount) {
        // TRUNCATE: Remove from end
        setConfig((prev) => ({
          ...prev,
          roundFocus: (prev.roundFocus || []).slice(0, targetCount)
        }));
      }
    }
  }, [config.rounds, workoutType.id]);

  // Check for workout conflicts and condition-based scaling
  useEffect(() => {
    if (!config || !todaysWorkouts) return;

    // Sprint 3: Condition Scaling
    if (condition === 'compromised' && workoutType.id === 'martial_arts') {
      const originalRounds = config.rounds || 0;
      if (originalRounds >= 8) {
        setCoachSuggestion({
          type: 'scale_back',
          message: `I see you're feeling compromised. Your plan calls for ${originalRounds} rounds of combat work, which creates high CNS load. I recommend scaling back to ${Math.ceil(originalRounds / 2)} rounds of light technical work today.`,
          changes: [
          `Reduce rounds from ${originalRounds} to ${Math.ceil(originalRounds / 2)}`,
          'Focus on technique over intensity',
          'Lower work-to-rest ratio'],

          modifiedConfig: {
            ...config,
            rounds: Math.ceil(originalRounds / 2),
            roundDuration: config.roundDuration * 0.75,
            restDuration: config.restDuration * 1.5
          }
        });
      }
    }

    // Sprint 3: Hybrid Swap - Check for leg fatigue
    if (workoutType.id === 'strength') {
      const hasLegExercises = config.exercises?.some((ex) =>
      ex.category === 'legs' ||
      ex.title.toLowerCase().includes('squat') ||
      ex.title.toLowerCase().includes('deadlift')
      );

      if (hasLegExercises) {
        const todayEnduranceWorkout = todaysWorkouts.find((w) => {
          if (w.workout_type === 'endurance') return true;
          const chapters = w.session_data?.chapters || [];
          return chapters.some((ch) => ch.type === 'endurance');
        });

        if (todayEnduranceWorkout) {
          setCoachSuggestion({
            type: 'swap_workout',
            message: `Heavy leg fatigue detected from your run earlier today. Starting a leg-focused strength session now risks overtraining your lower body. I recommend swapping to an upper body template or a stretching-only recovery session.`,
            changes: [
            'Detected: Recent endurance work',
            'Risk: Compounded leg fatigue',
            'Suggestion: Focus on upper body or recovery today'],

            modifiedConfig: null
          });
        }
      }
    }
  }, [condition, config, todaysWorkouts, workoutType]);

  const handleLoadTemplate = (template, mode) => {
    if (template.is_hybrid && mode === 'load') {
      // Load full hybrid template - use first chapter that matches current workout type
      const matchingChapter = template.chapters.find((ch) => ch.type === workoutType.id);
      if (matchingChapter) {
        setConfig(matchingChapter.config || {});
      }
    } else if (!template.is_hybrid) {
      // Load single component template
      setConfig(template.config || {});
    }
    setShowTemplates(false);
  };

  const handleStart = () => {
    // Check if we should show coach suggestion
    if (coachSuggestion && !coachSuggestion.dismissed) {
      return; // Wait for user to accept/decline
    }
    onStart(workoutType.id, config, condition);
  };

  const handleAcceptSuggestion = () => {
    if (coachSuggestion.modifiedConfig) {
      setConfig(coachSuggestion.modifiedConfig);
    }
    setCoachSuggestion({ ...coachSuggestion, dismissed: true });

    // If no modified config (e.g., workout swap suggestion), user needs to pick alternative
    if (!coachSuggestion.modifiedConfig) {
      onClose();
    }
  };

  const handleDeclineSuggestion = () => {
    setCoachSuggestion({ ...coachSuggestion, dismissed: true });
  };

  const addRoundFocus = () => {
    const newRound = (config.roundFocus || []).length + 1;
    setConfig({
      ...config,
      roundFocus: [...(config.roundFocus || []), { round: newRound, focus: '' }]
    });
  };

  const updateRoundFocus = (index, value) => {
    const updated = [...(config.roundFocus || [])];
    updated[index].focus = value;
    setConfig({ ...config, roundFocus: updated });
  };

  const removeRoundFocus = (index) => {
    setConfig({
      ...config,
      roundFocus: (config.roundFocus || []).filter((_, i) => i !== index)
    });
  };

  const backdropGradients = {
    martial_arts: 'from-red-950/50 via-black to-orange-950/50',
    endurance: 'from-blue-950/50 via-black to-cyan-950/50',
    strength: 'from-purple-950/50 via-black to-pink-950/50',
    recovery: 'from-green-950/50 via-black to-emerald-950/50'
  };

  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ['workouts-readiness', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
    initialData: []
  });

  // Import readiness calculation
  const readinessData = React.useMemo(() => {
    if (typeof window !== 'undefined' && recentWorkouts.length > 0) {
      try {
        const { calculateReadiness } = require('@/components/performanceEngine');
        return calculateReadiness(recentWorkouts);
      } catch {
        return { zones: { upper_body: 100, lower_body: 100, cns: 100 }, overall: 100 };
      }
    }
    return { zones: { upper_body: 100, lower_body: 100, cns: 100 }, overall: 100 };
  }, [recentWorkouts]);

  const modalContent =
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`fixed inset-0 z-[700] overflow-hidden bg-gradient-to-br ${backdropGradients[workoutType.id] || 'from-black to-zinc-900'}`}
    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>

      {/* Animated backdrop blur */}
      <motion.div
      animate={{ opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 backdrop-blur-xl" />


      {/* Content Container */}
      <div className="relative h-full flex flex-col overflow-y-auto pb-32">
        {/* Top Header - Nova Logo */}
        <div className="flex items-center justify-center pt-6 pb-4">
          <motion.img
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69587c2e9dd9113c4d857e1d/e314d2a42_Nova2_01-03.png"
          alt="NOVA"
          className="w-8 h-8" />

        </div>

        {/* Close Button - Top Right */}
        <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors z-10">

          <X className="w-5 h-5 text-white/80" />
        </button>

        <div className="flex-1 px-6 max-w-2xl mx-auto w-full">
          {/* === TOP HALF: THE MISSION === */}
          <div className="space-y-6 mb-8">
            {/* Mission Header */}
            <div className="text-center">
              <h1 className="text-white text-4xl font-bold mb-2">{workoutType.name}</h1>
              <p className="text-white/40 text-sm uppercase tracking-wider">Pre-Flight Configuration</p>
            </div>

            {/* Template Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
              onClick={() => setShowTemplates(true)}
              variant="outline"
              className="h-12 border-dashed border-white/30 bg-white/5 backdrop-blur-xl text-white/70 hover:bg-white/10 hover:border-white/40">

                <FileText className="w-4 h-4 mr-2" />
                Load Template
              </Button>
              <Button
              onClick={() => setShowSaveTemplate(true)}
              variant="outline"
              className="h-12 border-dashed border-cyan-500/40 bg-cyan-500/5 backdrop-blur-xl text-cyan-400 hover:bg-cyan-500/10">

                <Save className="w-4 h-4 mr-2" />
                Save as Template
              </Button>
            </div>

            {/* Condition Rings */}
            <div>
              <label className="text-white/70 text-sm mb-4 block uppercase tracking-wider">Physical Condition</label>
              <div className="grid grid-cols-3 gap-3">
                {conditions.map((cond) =>
              <motion.button
                key={cond.id}
                onClick={() => setCondition(cond.id)}
                whileTap={{ scale: 0.95 }}
                animate={condition === cond.id ? {
                  boxShadow: ['0 0 20px rgba(6,182,212,0.3)', '0 0 40px rgba(6,182,212,0.6)', '0 0 20px rgba(6,182,212,0.3)']
                } : {}}
                transition={{ duration: 1.5, repeat: condition === cond.id ? Infinity : 0 }}
                className={`relative p-6 rounded-2xl border-2 transition-all backdrop-blur-xl ${
                condition === cond.id ?
                'border-cyan-500/70 bg-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.4)]' :
                'border-white/30 bg-white/5 hover:bg-white/10'}`
                }>

                    <div className="text-3xl mb-2">{cond.emoji}</div>
                    <div className={`text-sm font-bold mb-1 ${
                condition === cond.id ? 'text-cyan-300' : 'text-white/70'}`
                }>
                      {cond.label}
                    </div>
                    <div className="text-xs text-white/40">{cond.desc}</div>
                  </motion.button>
              )}
              </div>
            </div>

            {/* Pre-Flight Note based on readiness */}
            {readinessData.overall < 70 && workoutType.id === 'martial_arts' &&
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/40 rounded-xl p-4">

                <div className="flex items-start gap-3">
                  <div className="text-amber-400 text-xl">⚠️</div>
                  <div>
                    <div className="text-amber-300 font-semibold text-sm mb-1">Pre-Flight Note</div>
                    <div className="text-amber-200/80 text-xs">
                      Systemic fatigue is elevated ({readinessData.overall}% readiness). 
                      Nova Lab recommends -15% volume or intensity reduction today.
                    </div>
                  </div>
                </div>
              </motion.div>
          }
          </div>

          {/* === BOTTOM HALF: THE STRATEGY === */}
          <div className="space-y-6">
          {/* Combat Config */}
          {workoutType.id === 'martial_arts' &&
          <>
              {/* Combat Dial - Rounds Scroller */}
              <div>
                <label className="text-white/70 text-sm mb-3 block uppercase tracking-wider">Combat Dial</label>
                <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-6">
                  <div className="text-center mb-4">
                    <div className="text-white text-7xl font-black">{config.rounds}</div>
                    <div className="text-white/50 text-sm uppercase tracking-wider mt-2">Rounds</div>
                  </div>
                  <input
                  type="range"
                  min="1"
                  max="15"
                  value={config.rounds}
                  onChange={(e) => setConfig({ ...config, rounds: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 
                      [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(6,182,212,0.8)]" />




                </div>
              </div>

              {/* Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-5">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Round Time</div>
                  <div className="text-white text-4xl font-bold">{config.roundDuration}s</div>
                  <input
                  type="range"
                  min="30"
                  max="600"
                  step="15"
                  value={config.roundDuration}
                  onChange={(e) => setConfig({ ...config, roundDuration: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer mt-3
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-400" />



                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-5">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Rest Time</div>
                  <div className="text-white text-4xl font-bold">{config.restDuration}s</div>
                  <input
                  type="range"
                  min="30"
                  max="300"
                  step="15"
                  value={config.restDuration}
                  onChange={(e) => setConfig({ ...config, restDuration: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer mt-3
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400" />



                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm mb-3 block uppercase tracking-wider">Round Strategy</label>
                <div className="space-y-4 mb-3">
                  {(config.roundFocus || []).map((roundItem, roundIdx) => {
                  const roundDrill = roundItem.drill;
                  const isExpanded = expandedDrill === roundItem.round;
                  return (
                    <div key={roundIdx}>
                        {/* Round Number Badge */}
                        <div className="text-white/40 text-xs font-semibold mb-1.5 font-mono">
                          ROUND {roundItem.round}
                        </div>
                        
                        {roundDrill ? (
                      /* Perusable Drill Card */
                      <motion.button
                        onClick={() => setExpandedDrill(isExpanded ? null : roundItem.round)}
                        className="w-full bg-black/40 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-4 
                              hover:bg-black/60 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]
                              hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"


                        whileTap={{ scale: 0.98 }}>

                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 text-left">
                                <div className="text-white font-bold text-base mb-1 font-mono">
                                  {roundDrill.title}
                                </div>
                                <div className="text-cyan-400/60 text-xs uppercase tracking-wider">
                                  {roundDrill.category?.replace('_', ' ')}
                                </div>
                              </div>
                              <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}>

                                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </motion.div>
                            </div>

                            {/* Expanded Details View */}
                            {isExpanded &&
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-cyan-500/20"
                          onClick={(e) => e.stopPropagation()}>

                                {roundDrill.description &&
                          <div className="text-white/70 text-sm leading-relaxed mb-4">
                                    {roundDrill.description}
                                  </div>
                          }
                                
                                <div className="flex gap-2">
                                  <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfig({ ...config, selectedRound: roundItem.round });
                                setShowDrillLibrary(true);
                              }}
                              className="flex-1 h-10 bg-cyan-500/10 border border-cyan-500/40 rounded-lg 
                                      flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all">


                                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                                    <span className="text-cyan-400 text-xs font-semibold">Re-select</span>
                                  </button>
                                  <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfig((prevConfig) => {
                                  const updated = [...prevConfig.roundFocus];
                                  updated[roundIdx] = { ...updated[roundIdx], drill: null };
                                  return { ...prevConfig, roundFocus: updated };
                                });
                                setExpandedDrill(null);
                              }}
                              className="flex-1 h-10 bg-red-500/10 border border-red-500/40 rounded-lg 
                                      flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">


                                    <Trash2 className="w-4 h-4 text-red-400" />
                                    <span className="text-red-400 text-xs font-semibold">Remove</span>
                                  </button>
                                </div>
                              </motion.div>
                        }
                          </motion.button>) : (

                      /* Add Drill Button - Ghost State */
                      <button
                        onClick={() => {
                          setConfig({ ...config, selectedRound: roundItem.round });
                          setShowDrillLibrary(true);
                        }}
                        className="w-full h-14 bg-white/5 backdrop-blur-xl border border-dashed border-white/20 
                              rounded-xl flex items-center justify-center gap-2 
                              hover:bg-white/10 hover:border-white/30 transition-all group">



                            <Plus className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                            <span className="text-white/40 group-hover:text-white/60 text-sm font-medium transition-colors">
                              Add drill for this round
                            </span>
                          </button>)
                      }
                      </div>);

                })}
                </div>
              </div>




            </>
          }

          {/* Endurance Config */}
          {workoutType.id === 'endurance' &&
          <>
              {/* Endurance Dial - Rounds Scroller */}
              <div>
                <label className="text-white/70 text-sm mb-3 block uppercase tracking-wider">Interval Dial</label>
                <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-6">
                  <div className="text-center mb-4">
                    <div className="text-white text-7xl font-black">{config.rounds}</div>
                    <div className="text-white/50 text-sm uppercase tracking-wider mt-2">Rounds</div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={config.rounds}
                    onChange={(e) => setConfig({ ...config, rounds: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 
                      [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                  />
                </div>
              </div>

              {/* Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-5">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Work Time</div>
                  <div className="text-white text-4xl font-bold">{config.workDuration}s</div>
                  <input
                    type="range"
                    min="30"
                    max="600"
                    step="15"
                    value={config.workDuration}
                    onChange={(e) => setConfig({ ...config, workDuration: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer mt-3
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-400"
                  />
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-5">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Rest Time</div>
                  <div className="text-white text-4xl font-bold">{config.restDuration}s</div>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="15"
                    value={config.restDuration}
                    onChange={(e) => setConfig({ ...config, restDuration: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer mt-3
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm mb-3 block uppercase tracking-wider">Round Strategy</label>
                <div className="space-y-4 mb-3">
                  {(config.roundFocus || []).map((roundItem, roundIdx) => {
                    const roundExercise = roundItem.exercise;
                    const isExpanded = expandedDrill === roundItem.round;
                    return (
                      <div key={roundIdx}>
                        <div className="text-white/40 text-xs font-semibold mb-1.5 font-mono">
                          ROUND {roundItem.round}
                        </div>
                        
                        {roundExercise ? (
                          <motion.button
                            onClick={() => setExpandedDrill(isExpanded ? null : roundItem.round)}
                            className="w-full bg-black/40 backdrop-blur-xl border border-green-500/40 rounded-xl p-4 
                              hover:bg-black/60 transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]
                              hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]"
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 text-left">
                                <div className="text-white font-bold text-base mb-1 font-mono">
                                  {roundExercise.title}
                                </div>
                                <div className="text-green-400/60 text-xs uppercase tracking-wider">
                                  {roundExercise.category?.replace('_', ' ')}
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </motion.div>
                            </div>

                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-green-500/20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {roundExercise.description && (
                                  <div className="text-white/70 text-sm leading-relaxed mb-4">
                                    {roundExercise.description}
                                  </div>
                                )}
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfig({ ...config, selectedRound: roundItem.round });
                                      setShowEnduranceLibrary(true);
                                    }}
                                    className="flex-1 h-10 bg-green-500/10 border border-green-500/40 rounded-lg 
                                      flex items-center justify-center gap-2 hover:bg-green-500/20 transition-all"
                                  >
                                    <RefreshCw className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 text-xs font-semibold">Re-select</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfig((prevConfig) => {
                                        const updated = [...prevConfig.roundFocus];
                                        updated[roundIdx] = { ...updated[roundIdx], exercise: null };
                                        return { ...prevConfig, roundFocus: updated };
                                      });
                                      setExpandedDrill(null);
                                    }}
                                    className="flex-1 h-10 bg-red-500/10 border border-red-500/40 rounded-lg 
                                      flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                    <span className="text-red-400 text-xs font-semibold">Remove</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </motion.button>
                        ) : (
                          <button
                            onClick={() => {
                              setConfig({ ...config, selectedRound: roundItem.round });
                              setShowEnduranceLibrary(true);
                            }}
                            className="w-full h-14 bg-white/5 backdrop-blur-xl border border-dashed border-white/20 
                              rounded-xl flex items-center justify-center gap-2 
                              hover:bg-white/10 hover:border-white/30 transition-all group"
                          >
                            <Plus className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                            <span className="text-white/40 group-hover:text-white/60 text-sm font-medium transition-colors">
                              Add exercise for this round
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          }

          {/* Strength Config */}
          {workoutType.id === 'strength' &&
          <div>
              <label className="text-white/60 text-sm mb-2 block">Selected Exercises</label>
              <div className="space-y-2 mb-3">
                {(config.exercises || []).length > 0 ?
              (config.exercises || []).map((ex, idx) =>
              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{ex.title}</div>
                        <div className="text-white/40 text-xs">{ex.category?.replace('_', ' ')}</div>
                      </div>
                      <button
                  onClick={() => {
                    const updated = (config.exercises || []).filter((_, i) => i !== idx);
                    setConfig({ ...config, exercises: updated });
                  }}
                  className="w-8 h-8 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center hover:bg-red-500/20">

                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
              ) :

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-white/40 text-sm">No exercises selected yet</div>
                  </div>
              }
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSmartLogPreflight(true)}
                  className="flex-1 h-12 font-semibold backdrop-blur-2xl border border-cyan-500/30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(37, 99, 235, 0.12) 100%)',
                    boxShadow: 'inset 0 0 40px rgba(6, 182, 212, 0.15), 0 0 30px rgba(6, 182, 212, 0.1)'
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Smart Log
                </Button>
                <Button
                  onClick={() => setShowExerciseLibrary(true)}
                  variant="outline"
                  className="flex-1 h-12 bg-white/5 border border-dashed border-white/20 hover:bg-white/10"
                >
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </div>
          }

          {/* Recovery Config */}
          {workoutType.id === 'recovery' &&
          <>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Recovery Mode</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                  onClick={() => setConfig({ ...config, mode: 'exposure' })}
                  className={`p-3 rounded-xl border transition-all ${
                  config.mode === 'exposure' ?
                  'bg-orange-500/20 border-orange-500/40 text-orange-400' :
                  'bg-white/5 border-white/10 text-white/60'}`
                  }>

                    <Flame className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">Heat/Cold</div>
                  </button>
                  <button
                  onClick={() => setConfig({ ...config, mode: 'stretching' })}
                  className={`p-3 rounded-xl border transition-all ${
                  config.mode === 'stretching' ?
                  'bg-green-500/20 border-green-500/40 text-green-400' :
                  'bg-white/5 border-white/10 text-white/60'}`
                  }>

                    <div className="text-lg mx-auto mb-1">🧘</div>
                    <div className="text-xs font-medium">Stretching</div>
                  </button>
                  <button
                  onClick={() => setConfig({ ...config, mode: 'hybrid' })}
                  className={`p-3 rounded-xl border transition-all ${
                  config.mode === 'hybrid' ?
                  'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' :
                  'bg-white/5 border-white/10 text-white/60'}`
                  }>

                    <div className="text-lg mx-auto mb-1">⚡</div>
                    <div className="text-xs font-medium">Hybrid</div>
                  </button>
                </div>
              </div>

              {config.mode === 'hybrid' && (config.stretches?.length > 0 || config.rounds?.length > 0) &&
            <div>
                  <label className="text-white/60 text-sm mb-2 block">Start With</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                  onClick={() => setConfig({ ...config, startWith: 'stretching' })}
                  className={`p-3 rounded-xl border transition-all ${
                  config.startWith === 'stretching' ?
                  'bg-green-500/20 border-green-500/40 text-green-400' :
                  'bg-white/5 border-white/10 text-white/60'}`
                  }>

                      <div className="text-xs font-medium">Stretching First</div>
                    </button>
                    <button
                  onClick={() => setConfig({ ...config, startWith: 'exposure' })}
                  className={`p-3 rounded-xl border transition-all ${
                  config.startWith === 'exposure' ?
                  'bg-orange-500/20 border-orange-500/40 text-orange-400' :
                  'bg-white/5 border-white/10 text-white/60'}`
                  }>

                      <div className="text-xs font-medium">Exposure First</div>
                    </button>
                  </div>
                </div>
            }

              {(config.mode === 'stretching' || config.mode === 'hybrid') &&
            <div>
                  <label className="text-white/60 text-sm mb-2 block">Stretching Routine</label>
                  <div className="space-y-2 mb-3">
                    {config.stretches && config.stretches.length > 0 ?
                config.stretches.map((stretch, idx) =>
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">{stretch.title}</div>
                            <div className="text-white/40 text-xs">{stretch.target_hold_seconds}s hold • {stretch.category}</div>
                          </div>
                          <button
                    onClick={() => {
                      const updated = config.stretches.filter((_, i) => i !== idx);
                      setConfig({ ...config, stretches: updated });
                    }}
                    className="w-8 h-8 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center hover:bg-red-500/20">

                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                ) :

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-white/40 text-sm">No stretches selected yet</div>
                      </div>
                }
                  </div>
                  <Button
                onClick={() => setShowStretchLibrary(true)}
                variant="outline"
                className="w-full border-dashed border-white/20 text-white/60 hover:bg-white/5">

                    <Plus className="w-4 h-4 mr-2" />
                    Add Stretch
                  </Button>
                </div>
            }

              {(config.mode === 'exposure' || config.mode === 'hybrid') &&
            <div>
                  <label className="text-white/60 text-sm mb-2 block">Exposure Rounds</label>
                  <div className="space-y-2 mb-3">
                    {config.rounds && config.rounds.length > 0 ?
                config.rounds.map((round, idx) =>
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-white font-medium text-sm flex items-center gap-2">
                              {round.type === 'heat' ? <Flame className="w-4 h-4 text-orange-400" /> : <Snowflake className="w-4 h-4 text-cyan-400" />}
                              {round.type === 'heat' ? 'Heat' : 'Cold'} Exposure
                            </div>
                            <button
                      onClick={() => {
                        const updated = config.rounds.filter((_, i) => i !== idx);
                        setConfig({ ...config, rounds: updated });
                      }}
                      className="w-8 h-8 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center hover:bg-red-500/20">

                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                          {round.mode === 'timed' ?
                  <div className="flex items-center gap-2">
                              <label className="text-white/60 text-xs">Target (seconds):</label>
                              <Input
                      type="number"
                      value={round.targetSeconds}
                      onChange={(e) => {
                        const updated = [...config.rounds];
                        updated[idx].targetSeconds = parseInt(e.target.value) || 60;
                        setConfig({ ...config, rounds: updated });
                      }}
                      className="h-8 w-24 bg-black/30 border-white/10 text-white text-sm" />

                            </div> :

                  <div className="text-white/40 text-xs">Free Duration</div>
                  }
                        </div>
                ) :

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-white/40 text-sm">No exposure rounds added</div>
                      </div>
                }
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                    onClick={() => {
                      setConfig({
                        ...config,
                        rounds: [...(config.rounds || []), { type: 'heat', mode: 'timed', targetSeconds: 300 }]
                      });
                    }}
                    variant="outline"
                    className="flex-1 border-dashed border-orange-500/30 text-orange-400 hover:bg-orange-500/10">

                        <Flame className="w-4 h-4 mr-2" />
                        Heat (Timed)
                      </Button>
                      <Button
                    onClick={() => {
                      setConfig({
                        ...config,
                        rounds: [...(config.rounds || []), { type: 'cold', mode: 'timed', targetSeconds: 120 }]
                      });
                    }}
                    variant="outline"
                    className="flex-1 border-dashed border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">

                        <Snowflake className="w-4 h-4 mr-2" />
                        Cold (Timed)
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                    onClick={() => {
                      setConfig({
                        ...config,
                        rounds: [...(config.rounds || []), { type: 'heat', mode: 'free' }]
                      });
                    }}
                    variant="outline"
                    className="flex-1 border-dashed border-orange-500/20 text-orange-400/80 hover:bg-orange-500/5">

                        <Flame className="w-4 h-4 mr-2" />
                        Heat (Free)
                      </Button>
                      <Button
                    onClick={() => {
                      setConfig({
                        ...config,
                        rounds: [...(config.rounds || []), { type: 'cold', mode: 'free' }]
                      });
                    }}
                    variant="outline"
                    className="flex-1 border-dashed border-cyan-500/20 text-cyan-400/80 hover:bg-cyan-500/5">

                        <Snowflake className="w-4 h-4 mr-2" />
                        Cold (Free)
                      </Button>
                    </div>
                  </div>
                </div>
            }
            </>
          }

          {/* Bio-Status Footer - Readiness Bars */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-5 mt-8">
            <div className="text-white/60 text-xs uppercase tracking-wider mb-3">Bio-Status</div>
            <div className="space-y-3">
              {[
              { id: 'upper_body', label: 'Upper', score: readinessData.zones.upper_body },
              { id: 'lower_body', label: 'Lower', score: readinessData.zones.lower_body },
              { id: 'cns', label: 'CNS', score: readinessData.zones.cns }].
              map((zone) =>
              <div key={zone.id} className="flex items-center gap-3">
                  <div className="text-white/60 text-xs w-14">{zone.label}</div>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${zone.score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${
                    zone.score >= 85 ? 'bg-green-400' :
                    zone.score >= 60 ? 'bg-amber-400' :
                    'bg-red-400'}`
                    } />

                  </div>
                  <div className="text-white text-xs font-bold w-10 text-right">{Math.round(zone.score)}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Start Button */}
          <motion.div whileTap={{ scale: 0.98 }} className="mt-8">
            <Button
              onClick={handleStart}
              size="lg"
              className="w-full h-20 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-black text-2xl tracking-wider shadow-[0_0_40px_rgba(6,182,212,0.4)]">

              LAUNCH {workoutType.name.toUpperCase()}
            </Button>
          </motion.div>
        </div>

        {/* AI Coach FAB - Bottom Right */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center justify-center hover:bg-black/60 transition-all group z-20">

          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>

            <Sparkles className="w-6 h-6 text-violet-400 group-hover:text-violet-300 transition-colors" />
          </motion.div>
        </motion.button>
      </div>

      {showTemplates &&
      <TemplateSelector
        user={user}
        workoutType={workoutType.id}
        onLoadTemplate={handleLoadTemplate}
        onClose={() => setShowTemplates(false)} />

      }

      {showSaveTemplate &&
      <SavePreFlightTemplateModal
        workoutType={workoutType}
        config={config}
        user={user}
        onClose={() => setShowSaveTemplate(false)} />

      }

      {showExerciseLibrary &&
      <ExerciseLibraryModal
        user={user}
        onSelect={(exercise) => {
          setConfig({
            ...config,
            exercises: [...(config.exercises || []), exercise]
          });
        }}
        onClose={() => setShowExerciseLibrary(false)} />

      }

      {showDrillLibrary &&
      <CombatDrillLibraryModal
        user={user}
        onSelect={(drill) => {
          setConfig((prev) => ({
            ...prev,
            roundFocus: (prev.roundFocus || []).map((r) =>
            r.round === prev.selectedRound ? { ...r, drill: drill } : r
            ),
            selectedRound: null
          }));
          setShowDrillLibrary(false);
        }}
        onClose={() => {
          setConfig((prev) => ({ ...prev, selectedRound: null }));
          setShowDrillLibrary(false);
        }} />

      }

      {showStretchLibrary &&
      <StretchLibraryModal
        user={user}
        onSelect={(stretch) => {
          setConfig({
            ...config,
            stretches: [...(config.stretches || []), stretch]
          });
        }}
        onClose={() => setShowStretchLibrary(false)} />

      }

      {showEnduranceLibrary &&
      <EnduranceLibraryModal
        user={user}
        onSelect={(exercise) => {
          setConfig((prev) => ({
            ...prev,
            roundFocus: (prev.roundFocus || []).map((r) =>
              r.round === prev.selectedRound ? { ...r, exercise: exercise } : r
            ),
            selectedRound: null
          }));
          setShowEnduranceLibrary(false);
        }}
        onClose={() => {
          setConfig((prev) => ({ ...prev, selectedRound: null }));
          setShowEnduranceLibrary(false);
        }} />

      }

      {showSmartLogPreflight && workoutType.id === 'strength' && (
        <NovaSmartLog
          onWorkoutParsed={(parsedExercises) => {
            const newExercises = parsedExercises.map(ex => ({
              title: ex.name,
              category: ex.category || 'Strength',
              sets: ex.sets
            }));
            setConfig({
              ...config,
              exercises: [...(config.exercises || []), ...newExercises]
            });
            setShowSmartLogPreflight(false);
          }}
          onClose={() => setShowSmartLogPreflight(false)}
        />
      )}

      {coachSuggestion && !coachSuggestion.dismissed &&
      <AdaptiveCoachSuggestion
        suggestion={coachSuggestion}
        onAccept={handleAcceptSuggestion}
        onDecline={handleDeclineSuggestion} />

      }
      </div>
    </motion.div>;


  return createPortal(modalContent, document.body);
}