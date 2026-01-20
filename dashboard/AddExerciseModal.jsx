import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Dumbbell, Activity, Target, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const exerciseLibrary = {
  gym: [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
    'Pull-up', 'Dip', 'Bicep Curl', 'Tricep Extension', 'Leg Press',
    'Lat Pulldown', 'Cable Fly', 'Romanian Deadlift', 'Front Squat'
  ],
  calisthenics: [
    'Push-up', 'Pull-up', 'Dip', 'Muscle-up', 'Handstand Push-up',
    'Planche', 'Front Lever', 'Back Lever', 'L-sit', 'Human Flag',
    'Pistol Squat', 'Dragon Flag', 'Ring Dip', 'Tuck Planche'
  ],
  run: [
    '5K Run', '10K Run', 'Sprint Intervals', 'Tempo Run', 'Long Run',
    'Hill Repeats', 'Track Workout', 'Easy Recovery Run'
  ],
  martial_arts: [
    'Sparring', 'Pad Work', 'Heavy Bag', 'Shadow Boxing', 'Grappling',
    'Technique Drills', 'Conditioning', 'Rolling'
  ]
};

export default function AddExerciseModal({ isOpen, onClose, onAdd }) {
  const [activeTab, setActiveTab] = useState('gym');
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');

  const filteredExercises = exerciseLibrary[activeTab].filter(ex =>
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExercise = (name) => {
    onAdd({
      id: Date.now().toString(),
      name,
      category: activeTab,
      sets: 3,
      reps: 10,
      weight: 0,
      rpe: 7,
      hold_time_seconds: 0,
      distance_km: 0,
      duration_seconds: 0
    });
    onClose();
    setSearchQuery('');
    setCustomName('');
  };

  const handleAddCustom = () => {
    if (customName.trim()) {
      handleAddExercise(customName.trim());
    }
  };

  if (!isOpen) return null;

  const categoryIcons = {
    gym: Dumbbell,
    calisthenics: Target,
    run: Activity,
    martial_arts: Swords
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-h-[85vh] bg-zinc-900 rounded-t-3xl border-t border-white/10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
            <h2 className="text-white font-bold text-lg">Add Exercise</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5"
            >
              <X className="w-5 h-5 text-white/60" />
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-white/30 h-10 rounded-full"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 bg-black/30 border-b border-white/5 rounded-none">
              {Object.keys(exerciseLibrary).map((category) => {
                const Icon = categoryIcons[category];
                return (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-cyan-400 flex flex-col gap-1 py-3"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] capitalize">{category.replace('_', ' ')}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise}
                    onClick={() => handleAddExercise(exercise)}
                    className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
                  >
                    {exercise}
                  </button>
                ))}
              </div>

              {/* Custom Exercise Input */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="text-white/60 text-sm mb-2 block">Custom Exercise</label>
                <div className="flex gap-2">
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
                    placeholder="Enter custom exercise name..."
                    className="flex-1 bg-black/30 border-white/10 text-white placeholder:text-white/30 h-10"
                  />
                  <Button
                    onClick={handleAddCustom}
                    disabled={!customName.trim()}
                    className="nova-gradient px-6"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}