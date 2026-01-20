import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Sparkles, Clock, Leaf, Dumbbell, TrendingDown, TrendingUp, Activity, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NutritionPreFlightWindow({ onSave, onClose, currentGoals }) {
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [customValues, setCustomValues] = useState({
    calories: currentGoals?.calorie_target || 2000,
    protein: currentGoals?.protein_target || 150,
    carbs: currentGoals?.carbs_target || 200,
    fat: currentGoals?.fat_target || 65,
    fiber: currentGoals?.fiber_target || 30,
    water: currentGoals?.water_target || 2.5
  });

  const smartPresets = [
    {
      id: 'cutting',
      name: 'Cutting',
      icon: TrendingDown,
      color: 'from-red-500 to-orange-500',
      description: 'Lose fat, maintain muscle',
      modifiers: { calories: -300, protein: 20, carbs: -50, fat: -15, fiber: 5 }
    },
    {
      id: 'bulking',
      name: 'Bulking',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      description: 'Build muscle & size',
      modifiers: { calories: 500, protein: 40, carbs: 100, fat: 20, fiber: 5 }
    },
    {
      id: 'high_protein',
      name: 'High Protein',
      icon: Dumbbell,
      color: 'from-purple-500 to-pink-500',
      description: 'Max protein intake',
      modifiers: { calories: 0, protein: 60, carbs: -30, fat: -10, fiber: 0 }
    },
    {
      id: 'plant_diversity',
      name: 'Plant Diversity',
      icon: Leaf,
      color: 'from-green-400 to-teal-500',
      description: '30+ plants per week',
      modifiers: { calories: 0, protein: -20, carbs: 50, fat: 0, fiber: 15 }
    },
    {
      id: 'high_fiber',
      name: 'High Fiber',
      icon: Activity,
      color: 'from-amber-500 to-orange-500',
      description: 'Gut health focused',
      modifiers: { calories: 0, protein: 0, carbs: 30, fat: 0, fiber: 20 }
    },
    {
      id: 'intermittent_fasting',
      name: 'IF 16:8',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      description: '16hr fast, 8hr feed',
      modifiers: { calories: -200, protein: 0, carbs: -20, fat: -10, fiber: 0 }
    },
    {
      id: 'keto',
      name: 'Keto',
      icon: Flame,
      color: 'from-red-600 to-pink-600',
      description: 'Very low carb, high fat',
      modifiers: { calories: 0, protein: 10, carbs: -150, fat: 80, fiber: 10 }
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: Sparkles,
      color: 'from-indigo-500 to-purple-500',
      description: 'Peak athletic output',
      modifiers: { calories: 300, protein: 30, carbs: 80, fat: 10, fiber: 5 }
    }
  ];

  const baseValues = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 30,
    water: 2.5
  };

  const togglePreset = (presetId) => {
    if (selectedPresets.includes(presetId)) {
      setSelectedPresets(selectedPresets.filter(id => id !== presetId));
    } else {
      setSelectedPresets([...selectedPresets, presetId]);
    }
  };

  const calculateTargets = () => {
    let totals = { ...baseValues };
    
    selectedPresets.forEach(presetId => {
      const preset = smartPresets.find(p => p.id === presetId);
      if (preset?.modifiers) {
        Object.keys(preset.modifiers).forEach(key => {
          totals[key] = (totals[key] || 0) + preset.modifiers[key];
        });
      }
    });

    return totals;
  };

  const handleApply = () => {
    const calculated = calculateTargets();
    setCustomValues(calculated);
  };

  const handleSave = () => {
    onSave({
      calorie_target: customValues.calories,
      protein_target: customValues.protein,
      carbs_target: customValues.carbs,
      fat_target: customValues.fat,
      fiber_target: customValues.fiber,
      water_target: customValues.water,
      selected_presets: selectedPresets
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[200] overflow-y-auto"
    >
      <div className="min-h-full flex flex-col">
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex-1 bg-transparent max-w-2xl w-full mx-auto p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-2xl tracking-tight">Nutrition Cockpit</h2>
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/60" />
            </motion.button>
          </div>

          <div className="space-y-6">
            {/* Smart Presets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white/60 text-sm">Smart Presets (Multi-Select)</label>
                {selectedPresets.length > 0 && (
                  <Button
                    onClick={handleApply}
                    size="sm"
                    className="h-7 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {smartPresets.map((preset, idx) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPresets.includes(preset.id);
                  
                  return (
                    <motion.button
                      key={preset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => togglePreset(preset.id)}
                      className={`p-4 rounded-xl border transition-all relative backdrop-blur-xl ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.6)]">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center mb-2`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-white font-bold text-sm mb-1 text-left">{preset.name}</h3>
                      <p className="text-white/40 text-xs text-left leading-relaxed">{preset.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Custom Targets - Cockpit Steppers */}
            <div>
              <label className="text-white/60 text-sm mb-3 block uppercase tracking-wider">Daily Targets</label>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
                {[
                  { key: 'calories', label: 'Calories', step: 50, color: 'emerald' },
                  { key: 'protein', label: 'Protein', step: 5, suffix: 'g', color: 'emerald' },
                  { key: 'carbs', label: 'Carbs', step: 10, suffix: 'g', color: 'emerald' },
                  { key: 'fat', label: 'Fat', step: 5, suffix: 'g', color: 'emerald' },
                  { key: 'fiber', label: 'Fiber', step: 5, suffix: 'g', color: 'emerald' },
                  { key: 'water', label: 'Water', step: 0.25, suffix: 'L', color: 'cyan' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center bg-black/20 rounded-xl p-3">
                    <span className="text-white/60 text-xs uppercase tracking-wider font-semibold w-20">{item.label}</span>
                    <div className="flex items-center gap-3 ml-auto">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={() => setCustomValues({ 
                          ...customValues, 
                          [item.key]: Math.max(0, customValues[item.key] - item.step) 
                        })}
                        className={`w-10 h-10 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/30 text-${item.color}-400 font-bold text-xl hover:bg-${item.color}-500/20 flex items-center justify-center`}
                      >
                        −
                      </motion.button>
                      <div className={`text-${item.color}-400 text-2xl font-bold font-mono w-[120px] text-center neon-data`}>
                        {typeof customValues[item.key] === 'number' ? customValues[item.key].toFixed(item.key === 'water' ? 1 : 0) : customValues[item.key]}
                        {item.suffix && <span className="text-sm ml-1 text-white/40">{item.suffix}</span>}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={() => setCustomValues({ 
                          ...customValues, 
                          [item.key]: customValues[item.key] + item.step 
                        })}
                        className={`w-10 h-10 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/30 text-${item.color}-400 font-bold text-xl hover:bg-${item.color}-500/20 flex items-center justify-center`}
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {selectedPresets.length > 0 && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <div className="text-cyan-400 text-xs font-semibold mb-2">Active Presets:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPresets.map(presetId => {
                    const preset = smartPresets.find(p => p.id === presetId);
                    return preset ? (
                      <div key={presetId} className="bg-cyan-500/20 rounded-lg px-3 py-1 text-xs text-cyan-300">
                        {preset.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            <motion.button
              onClick={handleSave}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-lg tracking-wider rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-24"
            >
              SAVE NUTRITION TARGETS
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}