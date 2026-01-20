import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Search, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ExerciseLibraryModal({ onSelect, onClose, user }) {
  const [view, setView] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  const [newExercise, setNewExercise] = useState({
    title: '',
    description: '',
    category: 'legs',
    equipment: 'bodyweight',
    difficulty: 'intermediate'
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const result = await base44.entities.ExerciseLibrary.filter({});
      return result.filter(ex => ex.is_global || ex.created_by === user?.id);
    }
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (exerciseData) => {
      return await base44.entities.ExerciseLibrary.create({
        ...exerciseData,
        type: 'strength',
        created_by: user.id,
        is_global: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setView('browse');
      setNewExercise({
        title: '',
        description: '',
        category: 'legs',
        equipment: 'bodyweight',
        difficulty: 'intermediate'
      });
    }
  });

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'legs', label: 'Legs' },
    { id: 'back_pull', label: 'Back/Pull' },
    { id: 'chest_push', label: 'Chest/Push' },
    { id: 'core', label: 'Core' },
    { id: 'shoulder', label: 'Shoulders' }
  ];

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateExercise = () => {
    if (!newExercise.title.trim()) return;
    createExerciseMutation.mutate(newExercise);
  };

  if (view === 'create') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 max-h-[85vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-bold text-xl">Create Custom Exercise</h2>
            <button
              onClick={() => setView('browse')}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Exercise Name</label>
              <Input
                value={newExercise.title}
                onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                placeholder="e.g., Bulgarian Split Squat"
                className="bg-black/30 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Form Cues & Instructions</label>
              <Textarea
                value={newExercise.description}
                onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                placeholder="Describe proper form and key points..."
                className="bg-black/30 border-white/10 text-white min-h-24"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Muscle Group</label>
              <select
                value={newExercise.category}
                onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="legs">Legs</option>
                <option value="back_pull">Back/Pull</option>
                <option value="chest_push">Chest/Push</option>
                <option value="core">Core</option>
                <option value="shoulder">Shoulders</option>
              </select>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Equipment</label>
              <select
                value={newExercise.equipment}
                onChange={(e) => setNewExercise({ ...newExercise, equipment: e.target.value })}
                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="bodyweight">Bodyweight</option>
                <option value="weighted">Weighted</option>
                <option value="assisted">Assisted</option>
              </select>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Difficulty</label>
              <select
                value={newExercise.difficulty}
                onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value })}
                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <Button
              onClick={handleCreateExercise}
              disabled={!newExercise.title.trim() || createExerciseMutation.isPending}
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
            >
              {createExerciseMutation.isPending ? 'Saving...' : 'Save Exercise'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-xl">Exercise Library</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="pl-10 bg-black/30 border-white/10 text-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setView('create')}
            variant="outline"
            className="w-full border-dashed border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Exercise
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredExercises.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => {
                onSelect(exercise);
                onClose();
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{exercise.title}</h3>
                    {!exercise.is_global && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  {exercise.description && (
                    <p className="text-white/60 text-sm line-clamp-2">{exercise.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {exercise.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {exercise.equipment}
                    </span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>
                <Dumbbell className="w-5 h-5 text-white/40 flex-shrink-0" />
              </div>
            </button>
          ))}

          {filteredExercises.length === 0 && (
            <div className="text-white/40 text-center py-12">
              No exercises found. Try a different search or category.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}