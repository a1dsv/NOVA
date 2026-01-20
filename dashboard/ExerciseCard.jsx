import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ExerciseCard({ exercise, onUpdate, onDelete }) {
  const handleSetChange = (delta) => {
    onUpdate({ ...exercise, sets: Math.max(1, (exercise.sets || 1) + delta) });
  };

  const handleFieldChange = (field, value) => {
    onUpdate({ ...exercise, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold">{exercise.name}</h3>
          <p className="text-white/40 text-xs capitalize">{exercise.category || 'exercise'}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Sets Control */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-sm">Sets</span>
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSetChange(-1)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10"
          >
            <Minus className="w-4 h-4 text-white/60" />
          </Button>
          <span className="text-white font-bold w-8 text-center">{exercise.sets || 1}</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSetChange(1)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10"
          >
            <Plus className="w-4 h-4 text-white/60" />
          </Button>
        </div>
      </div>

      {/* Dynamic Fields Based on Category */}
      <div className="space-y-2">
        {(exercise.category === 'gym' || exercise.category === 'calisthenics') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Reps</label>
              <Input
                type="number"
                value={exercise.reps || ''}
                onChange={(e) => handleFieldChange('reps', parseInt(e.target.value) || 0)}
                className="bg-black/30 border-white/10 text-white h-9"
                placeholder="0"
              />
            </div>
            {exercise.category === 'gym' && (
              <div>
                <label className="text-white/40 text-xs mb-1 block">Weight (lbs)</label>
                <Input
                  type="number"
                  value={exercise.weight || ''}
                  onChange={(e) => handleFieldChange('weight', parseInt(e.target.value) || 0)}
                  className="bg-black/30 border-white/10 text-white h-9"
                  placeholder="0"
                />
              </div>
            )}
          </div>
        )}

        {exercise.category === 'calisthenics' && (
          <div>
            <label className="text-white/40 text-xs mb-1 block">Hold Time (seconds)</label>
            <Input
              type="number"
              value={exercise.hold_time_seconds || ''}
              onChange={(e) => handleFieldChange('hold_time_seconds', parseInt(e.target.value) || 0)}
              className="bg-black/30 border-white/10 text-white h-9"
              placeholder="0"
            />
          </div>
        )}

        {exercise.category === 'run' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Distance (km)</label>
              <Input
                type="number"
                step="0.1"
                value={exercise.distance_km || ''}
                onChange={(e) => handleFieldChange('distance_km', parseFloat(e.target.value) || 0)}
                className="bg-black/30 border-white/10 text-white h-9"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Duration (min)</label>
              <Input
                type="number"
                value={exercise.duration_seconds ? Math.round(exercise.duration_seconds / 60) : ''}
                onChange={(e) => handleFieldChange('duration_seconds', (parseInt(e.target.value) || 0) * 60)}
                className="bg-black/30 border-white/10 text-white h-9"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* RPE for gym */}
        {exercise.category === 'gym' && (
          <div>
            <label className="text-white/40 text-xs mb-1 block">RPE (1-10)</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={exercise.rpe || ''}
              onChange={(e) => handleFieldChange('rpe', parseInt(e.target.value) || 0)}
              className="bg-black/30 border-white/10 text-white h-9"
              placeholder="0"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}