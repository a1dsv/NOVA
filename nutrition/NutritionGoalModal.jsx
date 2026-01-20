import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, TrendingDown, Minus, TrendingUp, Dumbbell, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NutritionGoalModal({ isOpen, onClose, currentGoals }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [customValues, setCustomValues] = useState({
    calories: currentGoals?.calorie_target || 2000,
    protein: currentGoals?.protein_target || 150,
    carbs: currentGoals?.carbs_target || 200,
    fat: currentGoals?.fat_target || 65
  });

  const queryClient = useQueryClient();

  const goalModes = [
    {
      id: 'cutting',
      name: 'Cutting',
      icon: TrendingDown,
      color: 'from-red-500 to-orange-500',
      description: 'Lose fat while maintaining muscle',
      targets: { calories: 1800, protein: 180, carbs: 150, fat: 50 }
    },
    {
      id: 'maintaining',
      name: 'Maintaining',
      icon: Minus,
      color: 'from-blue-500 to-cyan-500',
      description: 'Maintain current physique',
      targets: { calories: 2200, protein: 160, carbs: 220, fat: 70 }
    },
    {
      id: 'bulking',
      name: 'Bulking',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      description: 'Build muscle and size',
      targets: { calories: 2800, protein: 200, carbs: 300, fat: 85 }
    },
    {
      id: 'high_protein',
      name: 'High Protein',
      icon: Dumbbell,
      color: 'from-purple-500 to-pink-500',
      description: 'Maximize protein intake',
      targets: { calories: 2200, protein: 220, carbs: 180, fat: 60 }
    },
    {
      id: 'plant_diversity',
      name: 'Plant Diversity',
      icon: Leaf,
      color: 'from-green-400 to-teal-500',
      description: 'Focus on varied plant foods',
      targets: { calories: 2000, protein: 120, carbs: 250, fat: 65 }
    }
  ];

  const saveGoalsMutation = useMutation({
    mutationFn: async (goals) => {
      await base44.auth.updateMe(goals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-nutrition-goals']);
      onClose();
    }
  });

  const handleSelectMode = (mode) => {
    setSelectedMode(mode.id);
    if (mode.id !== 'custom') {
      setCustomValues(mode.targets);
    }
  };

  const handleSave = () => {
    saveGoalsMutation.mutate({
      nutrition_goal_mode: selectedMode,
      calorie_target: customValues.calories,
      protein_target: customValues.protein,
      carbs_target: customValues.carbs,
      fat_target: customValues.fat
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10">
            <h2 className="text-white font-bold text-lg">Set Nutrition Goals</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {goalModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSelectMode(mode)}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${mode.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{mode.name}</h3>
                    <p className="text-white/40 text-xs">{mode.description}</p>
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedMode('custom')}
                className={`p-4 rounded-xl border transition-all ${
                  selectedMode === 'custom'
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">Custom</h3>
                <p className="text-white/40 text-xs">Set your own targets</p>
              </button>
            </div>

            {selectedMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 rounded-xl p-4 space-y-4"
              >
                <h3 className="text-white font-semibold">Daily Targets</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Calories</label>
                    <Input
                      type="number"
                      value={customValues.calories}
                      onChange={(e) => setCustomValues({ ...customValues, calories: parseInt(e.target.value) || 0 })}
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Protein (g)</label>
                    <Input
                      type="number"
                      value={customValues.protein}
                      onChange={(e) => setCustomValues({ ...customValues, protein: parseInt(e.target.value) || 0 })}
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Carbs (g)</label>
                    <Input
                      type="number"
                      value={customValues.carbs}
                      onChange={(e) => setCustomValues({ ...customValues, carbs: parseInt(e.target.value) || 0 })}
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Fat (g)</label>
                    <Input
                      type="number"
                      value={customValues.fat}
                      onChange={(e) => setCustomValues({ ...customValues, fat: parseInt(e.target.value) || 0 })}
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saveGoalsMutation.isPending}
                  className="w-full h-12 nova-gradient text-white font-semibold"
                >
                  {saveGoalsMutation.isPending ? 'Saving...' : 'Save Goals'}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}