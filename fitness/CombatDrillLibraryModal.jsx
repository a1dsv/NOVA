import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Search, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function CombatDrillLibraryModal({ onSelect, onClose, user }) {
  const [view, setView] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  const [newDrill, setNewDrill] = useState({
    title: '',
    description: '',
    category: 'striking_jabs',
    equipment: 'bag_partner',
    difficulty: 'intermediate'
  });

  const { data: drills = [] } = useQuery({
    queryKey: ['combat-drills'],
    queryFn: async () => {
      const result = await base44.entities.ExerciseLibrary.filter({ type: 'combat' });
      return result.filter(ex => ex.is_global || ex.created_by === user?.id);
    }
  });

  const createDrillMutation = useMutation({
    mutationFn: async (drillData) => {
      return await base44.entities.ExerciseLibrary.create({
        ...drillData,
        type: 'combat',
        created_by: user.id,
        is_global: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-drills'] });
      setView('browse');
      setNewDrill({
        title: '',
        description: '',
        category: 'striking_jabs',
        equipment: 'bag_partner',
        difficulty: 'intermediate'
      });
    }
  });

  const categories = [
    { id: 'all', label: 'All Drills' },
    { id: 'striking_jabs', label: 'Striking/Jabs' },
    { id: 'kicks', label: 'Kicks' },
    { id: 'evasion_footwork', label: 'Evasion/Footwork' },
    { id: 'wrestling_takedowns', label: 'Wrestling/Takedowns' },
    { id: 'clinch', label: 'Clinch' }
  ];

  const filteredDrills = drills.filter(drill => {
    const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || drill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateDrill = () => {
    if (!newDrill.title.trim()) return;
    createDrillMutation.mutate(newDrill);
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
            <h2 className="text-white font-bold text-xl">Create Custom Drill</h2>
            <button
              onClick={() => setView('browse')}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Drill Name</label>
              <Input
                value={newDrill.title}
                onChange={(e) => setNewDrill({ ...newDrill, title: e.target.value })}
                placeholder="e.g., Jab-Cross-Hook Combo"
                className="bg-black/30 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Description & Focus</label>
              <Textarea
                value={newDrill.description}
                onChange={(e) => setNewDrill({ ...newDrill, description: e.target.value })}
                placeholder="Describe the drill, key points, and what it improves..."
                className="bg-black/30 border-white/10 text-white min-h-24"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Category</label>
              <select
                value={newDrill.category}
                onChange={(e) => setNewDrill({ ...newDrill, category: e.target.value })}
                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="striking_jabs">Striking/Jabs</option>
                <option value="kicks">Kicks</option>
                <option value="evasion_footwork">Evasion/Footwork</option>
                <option value="wrestling_takedowns">Wrestling/Takedowns</option>
                <option value="clinch">Clinch</option>
              </select>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Equipment/Partner Needed</label>
              <select
                value={newDrill.equipment}
                onChange={(e) => setNewDrill({ ...newDrill, equipment: e.target.value })}
                className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="bodyweight">Solo/Shadowboxing</option>
                <option value="bag_partner">Heavy Bag</option>
                <option value="assisted">Partner Required</option>
              </select>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Difficulty</label>
              <select
                value={newDrill.difficulty}
                onChange={(e) => setNewDrill({ ...newDrill, difficulty: e.target.value })}
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
              onClick={handleCreateDrill}
              disabled={!newDrill.title.trim() || createDrillMutation.isPending}
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold"
            >
              {createDrillMutation.isPending ? 'Saving...' : 'Save Drill'}
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
          <h2 className="text-white font-bold text-xl">Combat Drill Library</h2>
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
              placeholder="Search drills..."
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
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
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
            className="w-full border-dashed border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Drill
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredDrills.map(drill => (
            <button
              key={drill.id}
              onClick={() => {
                onSelect(drill);
                onClose();
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{drill.title}</h3>
                    {!drill.is_global && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  {drill.description && (
                    <p className="text-white/60 text-sm line-clamp-2">{drill.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {drill.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {drill.equipment === 'bodyweight' ? 'solo' : drill.equipment.replace('_', '/')}
                    </span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                      {drill.difficulty}
                    </span>
                  </div>
                </div>
                <Swords className="w-5 h-5 text-white/40 flex-shrink-0" />
              </div>
            </button>
          ))}

          {filteredDrills.length === 0 && (
            <div className="text-white/40 text-center py-12">
              No drills found. Try a different search or category.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}