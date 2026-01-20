import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function StretchLibraryModal({ onSelect, onClose, user }) {
  const [view, setView] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  const [newStretch, setNewStretch] = useState({
    title: '',
    description: '',
    category: 'hips',
    difficulty: 'beginner',
    target_hold_seconds: 30
  });

  const { data: stretches = [] } = useQuery({
    queryKey: ['stretches'],
    queryFn: async () => {
      const result = await base44.entities.StretchLibrary.list();
      return result.filter(s => s.is_global || s.created_by === user?.id);
    }
  });

  const createStretchMutation = useMutation({
    mutationFn: async (stretchData) => {
      return await base44.entities.StretchLibrary.create({
        ...stretchData,
        created_by: user.id,
        is_global: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stretches'] });
      setView('browse');
      setNewStretch({
        title: '',
        description: '',
        category: 'hips',
        difficulty: 'beginner',
        target_hold_seconds: 30
      });
    }
  });

  const categories = [
    { id: 'all', label: 'All Stretches' },
    { id: 'hips', label: 'Hips' },
    { id: 'hamstrings', label: 'Hamstrings' },
    { id: 'quads', label: 'Quads' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'back', label: 'Back' },
    { id: 'chest', label: 'Chest' },
    { id: 'calves', label: 'Calves' },
    { id: 'full_body', label: 'Full Body' }
  ];

  const filteredStretches = stretches.filter(stretch => {
    const matchesSearch = stretch.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || stretch.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateStretch = () => {
    if (!newStretch.title.trim()) return;
    createStretchMutation.mutate(newStretch);
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
            <h2 className="text-white font-bold text-xl">Create Custom Stretch</h2>
            <button
              onClick={() => setView('browse')}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Stretch Name</label>
              <Input
                value={newStretch.title}
                onChange={(e) => setNewStretch({ ...newStretch, title: e.target.value })}
                placeholder="e.g., Couch Stretch"
                className="bg-black/30 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Instructions & Cues</label>
              <Textarea
                value={newStretch.description}
                onChange={(e) => setNewStretch({ ...newStretch, description: e.target.value })}
                placeholder="Describe the stretch position and key points..."
                className="bg-black/30 border-white/10 text-white min-h-24"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Target Muscle Group</label>
              <select
                value={newStretch.category}
                onChange={(e) => setNewStretch({ ...newStretch, category: e.target.value })}
                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="hips">Hips</option>
                <option value="hamstrings">Hamstrings</option>
                <option value="quads">Quads</option>
                <option value="shoulders">Shoulders</option>
                <option value="back">Back</option>
                <option value="chest">Chest</option>
                <option value="calves">Calves</option>
                <option value="full_body">Full Body</option>
              </select>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Target Hold (seconds)</label>
              <Input
                type="number"
                value={newStretch.target_hold_seconds}
                onChange={(e) => setNewStretch({ ...newStretch, target_hold_seconds: parseInt(e.target.value) || 30 })}
                className="bg-black/30 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Difficulty</label>
              <select
                value={newStretch.difficulty}
                onChange={(e) => setNewStretch({ ...newStretch, difficulty: e.target.value })}
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
              onClick={handleCreateStretch}
              disabled={!newStretch.title.trim() || createStretchMutation.isPending}
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
            >
              {createStretchMutation.isPending ? 'Saving...' : 'Save Stretch'}
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
          <h2 className="text-white font-bold text-xl">Stretch Library</h2>
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
              placeholder="Search stretches..."
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
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
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
            className="w-full border-dashed border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Stretch
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredStretches.map(stretch => (
            <button
              key={stretch.id}
              onClick={() => {
                onSelect(stretch);
                onClose();
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{stretch.title}</h3>
                    {!stretch.is_global && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  {stretch.description && (
                    <p className="text-white/60 text-sm line-clamp-2">{stretch.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {stretch.category}
                    </span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {stretch.target_hold_seconds}s hold
                    </span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {stretch.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filteredStretches.length === 0 && (
            <div className="text-white/40 text-center py-12">
              No stretches found. Try a different search or category.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}