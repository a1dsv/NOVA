import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, CheckCircle, Minus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NovaSmartLog from './NovaSmartLog';
import { toast } from 'sonner';

export default function StrengthModule({ config, data, onUpdate, onFinish }) {
  const [exercises, setExercises] = useState(() => {
    const initialExercises = data.exercises || config.exercises || [];
    return initialExercises.map((ex) => ({
      ...ex,
      id: ex.id || Date.now() + Math.random(),
      sets: ex.sets || [],
      loadType: ex.loadType || 'bodyweight'
    }));
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showSmartLog, setShowSmartLog] = useState(false);

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) return;

    const newExercise = {
      id: Date.now(),
      name: newExerciseName,
      sets: [],
      loadType: 'bodyweight'
    };

    const updated = [...exercises, newExercise];
    setExercises(updated);
    onUpdate({ exercises: updated });
    setNewExerciseName('');
    setShowAddModal(false);
  };

  const handleAddSet = (exerciseIndex) => {
    const updated = [...exercises];
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];

    const newSet = {
      id: Date.now(),
      reps: lastSet?.reps || 0,
      weight: lastSet?.weight || 0,
      completed: false
    };

    updated[exerciseIndex].sets.push(newSet);
    setExercises(updated);
    onUpdate({ exercises: updated });
  };

  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
    onUpdate({ exercises: updated });
  };

  const handleCompleteSet = (exerciseIndex, setIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex].completed = true;
    setExercises(updated);
    onUpdate({ exercises: updated });
  };

  const handleToggleLoadType = (exerciseIndex, type) => {
    const updated = [...exercises];
    updated[exerciseIndex].loadType = type;
    setExercises(updated);
    onUpdate({ exercises: updated });
  };

  const handleDeleteExercise = (exerciseIndex) => {
    const updated = exercises.filter((_, idx) => idx !== exerciseIndex);
    setExercises(updated);
    onUpdate({ exercises: updated });
  };

  const handleDeleteSet = (exerciseIndex, setIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, idx) => idx !== setIndex);
    setExercises(updated);
    onUpdate({ exercises: updated });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-y-auto pb-48">
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <h2 className="text-white font-bold text-xl text-center">Strength Training</h2>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
        {exercises.map((exercise, exIdx) =>
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{exercise.name}</h3>

                <div className="flex gap-2 mt-2">
                  <button
                  onClick={() => handleToggleLoadType(exIdx, 'bodyweight')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  exercise.loadType === 'bodyweight' ?
                  'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-white/5 text-white/40 border border-white/10'}`
                  }>

                    BW
                  </button>
                  <button
                  onClick={() => handleToggleLoadType(exIdx, 'weighted')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  exercise.loadType === 'weighted' ?
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                  'bg-white/5 text-white/40 border border-white/10'}`
                  }>

                    +
                  </button>
                  <button
                  onClick={() => handleToggleLoadType(exIdx, 'assisted')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  exercise.loadType === 'assisted' ?
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-white/5 text-white/40 border border-white/10'}`
                  }>

                    -
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDeleteExercise(exIdx)}
                className="w-9 h-9 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>

            <div className="space-y-2 mb-3">
              {exercise.sets.map((set, setIdx) =>
            <div
              key={set.id}
              className={`border rounded-lg p-3 ${
              set.completed ?
              'bg-green-500/10 border-green-500/30' :
              'bg-white/5 border-white/10'}`
              }>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm font-semibold">Set {setIdx + 1}</span>
                    <div className="flex items-center gap-2">
                      {!set.completed &&
                        <Button
                          size="sm"
                          onClick={() => handleCompleteSet(exIdx, setIdx)}
                          className="h-7 bg-green-500 hover:bg-green-600 text-white">
                          <Check className="w-4 h-4 mr-1" />
                          Done
                        </Button>
                      }
                      {set.completed &&
                        <Check className="w-5 h-5 text-green-400" />
                      }
                      <button
                        onClick={() => handleDeleteSet(exIdx, setIdx)}
                        className="w-7 h-7 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {!set.completed &&
              <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Reps</label>
                        <Input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => handleUpdateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                    className="h-8 text-xs bg-black/30 border-white/10 text-white" />

                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Weight</label>
                        <Input
                    type="number"
                    value={set.weight || ''}
                    onChange={(e) => handleUpdateSet(exIdx, setIdx, 'weight', parseInt(e.target.value) || 0)}
                    className="h-8 text-xs bg-black/30 border-white/10 text-white" />

                      </div>
                    </div>
              }
                </div>
            )}
            </div>

            <Button
            onClick={() => handleAddSet(exIdx)}
            variant="ghost"
            className="w-full h-9 border border-dashed border-white/20 hover:border-cyan-400/40 text-white/60 hover:text-cyan-400">

              <Plus className="w-4 h-4 mr-2" />
              Add Set
            </Button>
          </motion.div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => setShowSmartLog(true)}
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
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="flex-1 h-12 bg-white/5 border border-dashed border-white/20 hover:border-cyan-400/40 text-white/60 hover:text-cyan-400"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={() => setShowAddModal(false)}>

            <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full">

              <h3 className="text-white font-bold text-xl mb-4">Add Exercise</h3>
              <Input
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExercise()}
              placeholder="Exercise name"
              className="bg-black/30 border-white/10 text-white mb-4" />

              <div className="flex gap-3">
                <Button
                onClick={() => setShowAddModal(false)}
                variant="outline" className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground h-9 flex-1">


                  Cancel
                </Button>
                <Button
                onClick={handleAddExercise}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600">

                  Add
                </Button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {showSmartLog && (
        <NovaSmartLog
          onWorkoutParsed={(parsedExercises) => {
            const newExercises = parsedExercises.map((ex, idx) => {
              // Intelligent Load Type Detection
              const hasWeight = ex.sets.some(set => set.weight > 0);
              const hasDistance = ex.sets.some(set => set.distance_km > 0);
              
              let detectedLoadType = 'bodyweight';
              if (hasWeight) detectedLoadType = 'weighted';
              if (hasDistance) detectedLoadType = 'cardio';

              return {
                id: `nova-${Date.now()}-${idx}-${Math.random()}`,
                name: ex.name,
                loadType: detectedLoadType,
                sets: ex.sets.map((set, setIdx) => ({
                  id: `set-${Date.now()}-${idx}-${setIdx}-${Math.random()}`,
                  reps: Number(set.reps) || 0,
                  weight: Number(set.weight) || 0,
                  hold_time_seconds: set.hold_time_seconds,
                  duration_seconds: set.duration_seconds,
                  distance_km: set.distance_km,
                  completed: false
                }))
              };
            });

            const updated = [...exercises, ...newExercises];
            setExercises(updated);
            onUpdate({ exercises: updated });
            setShowSmartLog(false);
          }}
          onClose={() => setShowSmartLog(false)}
        />
      )}
    </div>);

}