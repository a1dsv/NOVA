import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Clock, Square, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProgressiveOverloadSuggestion from './ProgressiveOverloadSuggestion';
import { base44 } from '@/api/base44Client';

export default function ActiveSessionCard({ exercise, onUpdate, onAddSet }) {
  const [activeSetIndex, setActiveSetIndex] = useState(null);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [user, setUser] = useState(null);
  const [loadType, setLoadType] = useState(exercise.load_type || 'bodyweight');

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    let interval;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const handleCompleteSet = (setIndex) => {
    const updatedRecords = [...(exercise.set_records || [])];
    updatedRecords[setIndex] = {
      ...updatedRecords[setIndex],
      completed: true,
      completed_at: new Date().toISOString()
    };
    
    onUpdate({
      ...exercise,
      set_records: updatedRecords
    });

    // Start rest timer
    setRestTimer(exercise.rest_seconds || 90);
    setIsResting(true);
    setActiveSetIndex(null);
  };

  const handleSetFieldChange = (setIndex, field, value) => {
    const updatedRecords = [...(exercise.set_records || [])];
    updatedRecords[setIndex] = {
      ...updatedRecords[setIndex],
      [field]: value
    };
    
    onUpdate({
      ...exercise,
      set_records: updatedRecords
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplySuggestion = (suggestion) => {
    const updatedRecords = exercise.set_records.map(set => ({
      ...set,
      weight: suggestion.target_weight || set.weight,
      reps: suggestion.target_reps || set.reps
    }));
    
    onUpdate({ ...exercise, set_records: updatedRecords });
  };

  const handleLoadTypeChange = (type) => {
    setLoadType(type);
    onUpdate({ ...exercise, load_type: type });
  };

  const handleAddSetWithMemory = () => {
    const lastSet = exercise.set_records?.[exercise.set_records.length - 1];
    const newSet = lastSet ? {
      reps: lastSet.reps || 0,
      weight: lastSet.weight || 0,
      rpe: 0,
      completed: false
    } : {
      reps: 0,
      weight: 0,
      rpe: 0,
      completed: false
    };

    const updatedRecords = [...(exercise.set_records || []), newSet];
    onUpdate({ ...exercise, set_records: updatedRecords });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold">{exercise.name}</h3>
          <p className="text-white/40 text-xs capitalize">{exercise.category}</p>
          
          {/* BW/+/- Toggle for Gym/Calisthenics */}
          {(exercise.category === 'gym' || exercise.category === 'calisthenics') && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleLoadTypeChange('bodyweight')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  loadType === 'bodyweight'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                BW
              </button>
              <button
                onClick={() => handleLoadTypeChange('weighted')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  loadType === 'weighted'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                <Plus className="w-3 h-3 inline mr-1" />
              </button>
              <button
                onClick={() => handleLoadTypeChange('assisted')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  loadType === 'assisted'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                <Minus className="w-3 h-3 inline mr-1" />
              </button>
            </div>
          )}
        </div>
        {isResting && (
          <div className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-3 py-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-bold">{formatTime(restTimer)}</span>
          </div>
        )}
      </div>

      {/* AI Progressive Overload Suggestion */}
      {user && (exercise.category === 'gym' || exercise.category === 'calisthenics') && (
        <ProgressiveOverloadSuggestion 
          exercise={exercise} 
          userId={user.id}
          onApplySuggestion={handleApplySuggestion}
        />
      )}

      {/* Set Records */}
      <div className="space-y-2 mb-3">
        <AnimatePresence>
          {(exercise.set_records || []).map((setRecord, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={`border rounded-lg p-3 transition-all ${
                setRecord.completed
                  ? 'bg-green-500/10 border-green-500/30'
                  : activeSetIndex === idx
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm font-semibold">Set {idx + 1}</span>
                {!setRecord.completed ? (
                  activeSetIndex === idx ? (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteSet(idx)}
                      className="h-7 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveSetIndex(idx)}
                      className="h-7 text-cyan-400"
                    >
                      Start
                    </Button>
                  )
                ) : (
                  <Check className="w-5 h-5 text-green-400" />
                )}
              </div>

              {/* Input Fields - Dynamic per workout type */}
              {(activeSetIndex === idx || setRecord.completed) && (
                <div className="grid grid-cols-3 gap-2">
                  {exercise.category === 'gym' && (
                    <>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Reps</label>
                        <Input
                          type="number"
                          value={setRecord.reps || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'reps', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Weight (lbs)</label>
                        <Input
                          type="number"
                          value={setRecord.weight || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'weight', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">RPE</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={setRecord.rpe || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'rpe', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                    </>
                  )}
                  
                  {exercise.category === 'calisthenics' && (
                    <>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Reps</label>
                        <Input
                          type="number"
                          value={setRecord.reps || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'reps', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Hold (s)</label>
                        <Input
                          type="number"
                          value={setRecord.hold_time_seconds || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'hold_time_seconds', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">RPE</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={setRecord.rpe || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'rpe', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                    </>
                  )}

                  {exercise.category === 'run' && (
                    <>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Distance (km)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={setRecord.distance_km || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'distance_km', parseFloat(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">Time (min)</label>
                        <Input
                          type="number"
                          value={setRecord.duration_seconds ? Math.round(setRecord.duration_seconds / 60) : ''}
                          onChange={(e) => handleSetFieldChange(idx, 'duration_seconds', (parseInt(e.target.value) || 0) * 60)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">RPE</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={setRecord.rpe || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'rpe', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                    </>
                  )}

                  {exercise.category === 'martial_arts' && (
                    <>
                      <div className="col-span-2">
                        <label className="text-white/40 text-[10px] block mb-1">Duration (min)</label>
                        <Input
                          type="number"
                          value={setRecord.duration_seconds ? Math.round(setRecord.duration_seconds / 60) : ''}
                          onChange={(e) => handleSetFieldChange(idx, 'duration_seconds', (parseInt(e.target.value) || 0) * 60)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-[10px] block mb-1">RPE</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={setRecord.rpe || ''}
                          onChange={(e) => handleSetFieldChange(idx, 'rpe', parseInt(e.target.value) || 0)}
                          disabled={setRecord.completed}
                          className="h-8 text-xs bg-black/30 border-white/10 text-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Set Button with Memory */}
      <Button
        onClick={handleAddSetWithMemory}
        variant="ghost"
        className="w-full h-9 border border-dashed border-white/20 hover:border-cyan-400/40 text-white/60 hover:text-cyan-400"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Set
      </Button>
    </motion.div>
  );
}