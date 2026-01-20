import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, Dumbbell, Activity, Swords, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const disciplines = [
  { id: 'strength', name: 'Strength', icon: Dumbbell },
  { id: 'endurance', name: 'Endurance', icon: Activity },
  { id: 'combat', name: 'Combat', icon: Swords },
  { id: 'nutrition', name: 'Nutrition', icon: Leaf }
];

const goalExamples = {
  strength: ['1RM Bench Press', '1RM Squat', '1RM Deadlift', 'Max Pull-ups'],
  endurance: ['5K Time', '10K Time', 'Half Marathon', 'Total Miles'],
  combat: ['Monthly Sparring Rounds', 'Striking Technique Mastery', 'Total Rounds'],
  nutrition: ['Weekly Plant Points', 'Protein Target Days', 'Meal Prep Consistency']
};

const commonExercises = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 
  'Pull-ups', 'Rows', 'Bicep Curls', 'Tricep Dips'
];

export default function SetGoalModal({ isOpen, onClose, onSave, user, editGoal }) {
  const [goalData, setGoalData] = useState({
    title: '',
    discipline: 'strength',
    target_value: '',
    current_value: 0,
    metric_unit: '',
    target_date: '',
    notes: ''
  });

  useEffect(() => {
    if (editGoal) {
      setGoalData({
        title: editGoal.title || '',
        discipline: editGoal.discipline || 'strength',
        target_value: editGoal.target_value || '',
        current_value: editGoal.current_value || 0,
        metric_unit: editGoal.metric_unit || '',
        target_date: editGoal.target_date || '',
        notes: editGoal.notes || ''
      });
    } else {
      setGoalData({
        title: '',
        discipline: 'strength',
        target_value: '',
        current_value: 0,
        metric_unit: '',
        target_date: '',
        notes: ''
      });
    }
  }, [editGoal, isOpen]);

  const handleSave = () => {
    if (!goalData.title || !goalData.target_value) return;
    
    onSave({
      ...goalData,
      target_value: parseFloat(goalData.target_value),
      current_value: parseFloat(goalData.current_value) || 0
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[200] overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center px-4 py-8">
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent w-full max-w-lg"
          >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-violet-400" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
              </div>
              <h2 className="text-white font-bold text-2xl tracking-tight">
                {editGoal ? 'Goal Editor' : 'Goal Cockpit'}
              </h2>
            </div>
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
            >
              <X className="w-5 h-5 text-white/60" />
            </motion.button>
          </div>

          <div className="space-y-4">
            {/* Discipline Selector */}
            <div>
              <label className="text-white/60 text-xs mb-3 block uppercase tracking-wider font-semibold">Discipline</label>
              <div className="grid grid-cols-2 gap-3">
                {disciplines.map((disc, idx) => {
                  const Icon = disc.icon;
                  const isSelected = goalData.discipline === disc.id;
                  return (
                    <motion.button
                      key={disc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setGoalData({ ...goalData, discipline: disc.id })}
                      className={`p-4 rounded-xl border backdrop-blur-xl transition-all ${
                        isSelected
                          ? 'border-violet-500/50 bg-violet-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-violet-400' : 'text-white/40'}`} 
                        style={isSelected ? { filter: 'drop-shadow(0 0 6px #8b5cf6)' } : {}} />
                      <div className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-violet-400' : 'text-white/60'}`}>
                        {disc.name}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Goal Title */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Goal Title</label>
              <Input
                value={goalData.title}
                onChange={(e) => setGoalData({ ...goalData, title: e.target.value })}
                placeholder={`e.g., ${goalExamples[goalData.discipline]?.[0] || 'My Goal'}`}
                className="bg-black/30 border-white/10 text-white"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {goalExamples[goalData.discipline]?.map((example) => (
                  <button
                    key={example}
                    onClick={() => setGoalData({ ...goalData, title: example })}
                    className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-cyan-400 hover:border-cyan-500/30"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Value & Unit - Massive Stepper */}
            <div className="space-y-4">
              <label className="text-white/60 text-xs block uppercase tracking-wider font-semibold">Target Value</label>
              <div className="bg-white/5 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]">
                <div className="flex items-center justify-between bg-black/20 rounded-xl p-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => setGoalData({ ...goalData, target_value: Math.max(0, parseFloat(goalData.target_value || 0) - 5) })}
                    className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 font-bold text-2xl hover:bg-violet-500/20"
                  >
                    −
                  </motion.button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      value={goalData.target_value}
                      onChange={(e) => setGoalData({ ...goalData, target_value: e.target.value })}
                      placeholder="225"
                      className="bg-transparent border-0 text-violet-400 text-4xl font-bold font-mono text-center w-full neon-data focus:outline-none"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => setGoalData({ ...goalData, target_value: parseFloat(goalData.target_value || 0) + 5 })}
                    className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 font-bold text-2xl hover:bg-violet-500/20"
                  >
                    +
                  </motion.button>
                </div>
                <Input
                  value={goalData.metric_unit}
                  onChange={(e) => setGoalData({ ...goalData, metric_unit: e.target.value })}
                  placeholder="Unit (lbs, reps, miles...)"
                  className="bg-black/30 border-white/10 text-white font-mono mt-3 h-12"
                />
              </div>
            </div>

            {/* Current Value */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Current Value (Optional)</label>
              <Input
                type="number"
                value={goalData.current_value}
                onChange={(e) => setGoalData({ ...goalData, current_value: e.target.value })}
                placeholder="185"
                className="bg-black/30 border-white/10 text-white"
              />
            </div>

            {/* Target Date */}
            <div>
              <label className="text-white/60 text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Target Date
              </label>
              <Input
                type="date"
                value={goalData.target_date}
                onChange={(e) => setGoalData({ ...goalData, target_date: e.target.value })}
                className="bg-black/30 border-white/10 text-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Notes (Optional)</label>
              <Textarea
                value={goalData.notes}
                onChange={(e) => setGoalData({ ...goalData, notes: e.target.value })}
                placeholder="Why this goal matters..."
                className="bg-black/30 border-white/10 text-white min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-1 h-14 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-semibold rounded-xl"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={!goalData.title || !goalData.target_value}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-1 h-14 bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold text-lg tracking-wider rounded-xl disabled:opacity-50 shadow-[0_0_30px_rgba(139,92,246,0.4)] active:shadow-[0_0_50px_rgba(139,92,246,0.8)] flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                {editGoal ? 'UPDATE GOAL' : 'CREATE GOAL'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
      </motion.div>
    </AnimatePresence>
  );
}