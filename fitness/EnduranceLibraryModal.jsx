import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Zap, Mountain, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function EnduranceLibraryModal({ user, onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    title: '',
    category: 'sprints',
    description: ''
  });

  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['endurance-library', user?.id],
    queryFn: async () => {
      const all = await base44.entities.EnduranceLibrary.list('-created_date', 200);
      return all;
    },
    enabled: !!user,
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EnduranceLibrary.create({
      ...data,
      user_id: user.id,
      is_system: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['endurance-library']);
      setShowCreateForm(false);
      setNewExercise({ title: '', category: 'sprints', description: '' });
    }
  });

  const categories = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'sprints', label: 'Sprints', icon: Zap },
    { id: 'hills', label: 'Hills', icon: Mountain },
    { id: 'kettlebells', label: 'Kettlebells', icon: Dumbbell },
    { id: 'rowing', label: 'Rowing', icon: Zap },
    { id: 'cycling', label: 'Cycling', icon: Zap },
    { id: 'swimming', label: 'Swimming', icon: Zap },
    { id: 'jump_rope', label: 'Jump Rope', icon: Zap },
    { id: 'sled', label: 'Sled', icon: Dumbbell },
    { id: 'custom', label: 'Custom', icon: Plus }
  ];

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    if (!newExercise.title.trim()) return;
    createMutation.mutate(newExercise);
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-bold text-xl">Endurance Library</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {showCreateForm ? (
          <div className="p-6 space-y-4">
            <Input
              placeholder="Exercise name"
              value={newExercise.title}
              onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
              className="bg-black/30 border-white/10 text-white"
            />
            <select
              value={newExercise.category}
              onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-black/30 border border-white/10 text-white"
            >
              {categories.filter(c => c.id !== 'all').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <Textarea
              placeholder="Description (optional)"
              value={newExercise.description}
              onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
              className="bg-black/30 border-white/10 text-white min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newExercise.title.trim()}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Exercise'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/30 border-white/10 text-white"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/60 border border-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 inline mr-1.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Exercise
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="text-center py-12 text-white/40">Loading...</div>
              ) : filteredExercises.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  No exercises found
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      onSelect(exercise);
                      onClose();
                    }}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-white font-semibold text-base mb-1">
                          {exercise.title}
                        </div>
                        <div className="text-cyan-400/60 text-xs uppercase tracking-wider mb-2">
                          {exercise.category.replace('_', ' ')}
                        </div>
                        {exercise.description && (
                          <div className="text-white/50 text-sm line-clamp-2">
                            {exercise.description}
                          </div>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500/30 transition-all">
                        <Plus className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}