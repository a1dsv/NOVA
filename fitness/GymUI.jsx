import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Minus, Weight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import NovaSmartLog from './NovaSmartLog';

export default function GymUI({ workout, onUpdate, onAddExercise, onFinish }) {
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [showSmartLog, setShowSmartLog] = useState(false);

  const handleLoadToggle = (exerciseIdx, loadType) => {
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIdx].load_type = loadType;
    if (loadType === 'bodyweight') {
      updatedExercises[exerciseIdx].load_value = 0;
    }
    onUpdate({ ...workout, exercises: updatedExercises });
  };

  const handleLoadValue = (exerciseIdx, value) => {
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIdx].load_value = parseFloat(value) || 0;
    onUpdate({ ...workout, exercises: updatedExercises });
  };

  const handleCompleteSet = (exerciseIdx, setIdx) => {
    const updatedExercises = [...workout.exercises];
    const set = updatedExercises[exerciseIdx].set_records[setIdx];
    set.completed = true;
    set.completed_at = new Date().toISOString();
    const updatedWorkout = { ...workout, exercises: updatedExercises };
    
    // HARD-SAVE to localStorage
    localStorage.setItem('active_workout', JSON.stringify(updatedWorkout));
    
    onUpdate(updatedWorkout);
  };

  const handleAddSet = (exerciseIdx) => {
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIdx].set_records.push({
      reps: 0,
      weight: 0,
      completed: false
    });
    onUpdate({ ...workout, exercises: updatedExercises });
  };

  const handleSetValue = (exerciseIdx, setIdx, field, value) => {
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIdx].set_records[setIdx][field] = parseFloat(value) || 0;
    const updatedWorkout = { ...workout, exercises: updatedExercises };
    
    // HARD-SAVE to localStorage
    localStorage.setItem('active_workout', JSON.stringify(updatedWorkout));
    
    onUpdate(updatedWorkout);
  };

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-2xl">STRENGTH</h2>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            {workout.exercises?.length || 0} exercises
          </Badge>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {workout.exercises?.map((exercise, exerciseIdx) => {
              const isExpanded = expandedExercise === exerciseIdx;
              const completedSets = exercise.set_records?.filter(s => s.completed).length || 0;
              const totalSets = exercise.set_records?.length || 0;

              return (
                <motion.div
                  key={exerciseIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedExercise(isExpanded ? null : exerciseIdx)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">{exercise.name}</h3>
                      <span className="text-white/40 text-sm">{completedSets}/{totalSets}</span>
                    </div>
                    
                    {/* Load Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadToggle(exerciseIdx, 'bodyweight');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          exercise.load_type === 'bodyweight'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        BW
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadToggle(exerciseIdx, 'weighted');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          exercise.load_type === 'weighted'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        <Plus className="w-3 h-3 inline mr-1" />+
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadToggle(exerciseIdx, 'assisted');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          exercise.load_type === 'assisted'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        <Minus className="w-3 h-3 inline mr-1" />-
                      </button>
                      
                      {exercise.load_type !== 'bodyweight' && (
                        <Input
                          type="number"
                          placeholder="KG"
                          value={exercise.load_value || ''}
                          onChange={(e) => handleLoadValue(exerciseIdx, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 h-8 bg-black/30 border-white/10 text-white text-xs"
                        />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-3">
                          {exercise.set_records?.map((set, setIdx) => (
                            <div
                              key={setIdx}
                              className={`rounded-xl p-3 ${
                                set.completed
                                  ? 'bg-green-500/10 border border-green-500/30'
                                  : 'bg-black/30 border border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/60 text-sm font-semibold">
                                  Set {setIdx + 1}
                                </span>
                                {set.completed ? (
                                  <Check className="w-5 h-5 text-green-400" />
                                ) : null}
                              </div>

                              {!set.completed && (
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div>
                                    <label className="text-white/40 text-xs block mb-1">Reps</label>
                                    <Input
                                      type="number"
                                      value={set.reps || ''}
                                      onChange={(e) => handleSetValue(exerciseIdx, setIdx, 'reps', e.target.value)}
                                      className="h-10 bg-black/30 border-white/10 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-white/40 text-xs block mb-1">Weight (kg)</label>
                                    <Input
                                      type="number"
                                      value={set.weight || ''}
                                      onChange={(e) => handleSetValue(exerciseIdx, setIdx, 'weight', e.target.value)}
                                      className="h-10 bg-black/30 border-white/10 text-white"
                                    />
                                  </div>
                                </div>
                              )}

                              {!set.completed && (
                                <Button
                                  onClick={() => handleCompleteSet(exerciseIdx, setIdx)}
                                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold"
                                >
                                  <Check className="w-5 h-5 mr-2" />
                                  SET COMPLETE
                                </Button>
                              )}
                            </div>
                          ))}

                          <Button
                            onClick={() => handleAddSet(exerciseIdx)}
                            variant="ghost"
                            className="w-full border border-dashed border-white/20 text-white/60"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Set
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowSmartLog(true)}
              className="flex-1 h-14 font-semibold backdrop-blur-2xl border border-cyan-500/30"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(37, 99, 235, 0.12) 100%)',
                boxShadow: 'inset 0 0 40px rgba(6, 182, 212, 0.15), 0 0 30px rgba(6, 182, 212, 0.1)'
              }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Smart Log
            </Button>
            <Button
              onClick={onAddExercise}
              className="flex-1 h-14 bg-white/5 border border-dashed border-white/20 hover:bg-white/10 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>

        <Button
          onClick={onFinish}
          className="w-full h-16 mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-lg"
        >
          Finish Gym Session
        </Button>
      </div>

      {showSmartLog && (
        <NovaSmartLog
          onWorkoutParsed={(parsedExercises) => {
            const updatedExercises = [...(workout.exercises || [])];
            
            // Convert parsed exercises to workout format
            parsedExercises.forEach(ex => {
              updatedExercises.push({
                name: ex.name,
                category: ex.category,
                load_type: 'bodyweight',
                load_value: 0,
                set_records: ex.sets.map(set => ({
                  reps: set.reps || 0,
                  weight: set.weight || 0,
                  hold_time_seconds: set.hold_time_seconds || null,
                  duration_seconds: set.duration_seconds || null,
                  distance_km: set.distance_km || null,
                  completed: false
                }))
              });
            });

            const updatedWorkout = { ...workout, exercises: updatedExercises };
            localStorage.setItem('active_workout', JSON.stringify(updatedWorkout));
            onUpdate(updatedWorkout);
            setShowSmartLog(false);
          }}
          onClose={() => setShowSmartLog(false)}
        />
      )}
    </div>
  );
}