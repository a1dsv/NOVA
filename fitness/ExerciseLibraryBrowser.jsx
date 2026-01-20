import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronRight, Dumbbell, Swords, Activity, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const categories = {
  strength: {
    label: 'Strength Training',
    icon: Dumbbell,
    color: 'cyan',
    sections: [
      { key: 'legs', label: 'Legs' },
      { key: 'back_pull', label: 'Back/Pull' },
      { key: 'chest_push', label: 'Chest/Push' },
      { key: 'core', label: 'Core' },
      { key: 'shoulder', label: 'Shoulders' }
    ]
  },
  combat: {
    label: 'Martial Arts',
    icon: Swords,
    color: 'red',
    sections: [
      { key: 'striking_jabs', label: 'Striking/Jabs' },
      { key: 'evasion_footwork', label: 'Evasion/Footwork' },
      { key: 'wrestling_takedowns', label: 'Wrestling/Takedowns' },
      { key: 'clinch', label: 'Clinch' },
      { key: 'kicks', label: 'Kicks' }
    ]
  },
  run: {
    label: 'Endurance',
    icon: Activity,
    color: 'green',
    sections: []
  }
};

export default function ExerciseLibraryBrowser({ onSelect, selectedExercises = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedType, setExpandedType] = useState('strength');
  const [expandedCategory, setExpandedCategory] = useState(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date', 500)
  });

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ex.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getExercisesByCategory = (category) => {
    return filteredExercises.filter(ex => ex.category === category);
  };

  const isSelected = (exercise) => {
    return selectedExercises.some(sel => sel.id === exercise.id);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search exercises..."
          className="pl-10 bg-black/30 border-white/10 text-white"
        />
      </div>

      {/* Categories */}
      {Object.entries(categories).map(([typeKey, typeData]) => {
        const Icon = typeData.icon;
        const isExpanded = expandedType === typeKey;

        return (
          <div key={typeKey} className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedType(isExpanded ? null : typeKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${typeData.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${typeData.color}-400`} />
                </div>
                <span className="text-white font-semibold">{typeData.label}</span>
              </div>
              {isExpanded ? <ChevronDown className="w-5 h-5 text-white/40" /> : <ChevronRight className="w-5 h-5 text-white/40" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10"
                >
                  {typeData.sections.length > 0 ? (
                    typeData.sections.map((section) => {
                      const sectionExercises = getExercisesByCategory(section.key);
                      const isSectionExpanded = expandedCategory === section.key;

                      return (
                        <div key={section.key} className="border-b border-white/5 last:border-0">
                          <button
                            onClick={() => setExpandedCategory(isSectionExpanded ? null : section.key)}
                            className="w-full flex items-center justify-between p-3 pl-6 hover:bg-white/5 transition-colors"
                          >
                            <span className="text-white/80 text-sm">{section.label}</span>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-white/10 text-white/60 text-xs">
                                {sectionExercises.length}
                              </Badge>
                              {isSectionExpanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isSectionExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-black/20 p-2"
                              >
                                {sectionExercises.length === 0 ? (
                                  <div className="text-white/40 text-xs text-center py-4">
                                    No exercises in this category
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {sectionExercises.map((exercise) => (
                                      <button
                                        key={exercise.id}
                                        onClick={() => onSelect(exercise)}
                                        className={`w-full text-left p-3 rounded-lg transition-all ${
                                          isSelected(exercise)
                                            ? 'bg-cyan-500/20 border border-cyan-500/50'
                                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm">{exercise.title}</p>
                                            <p className="text-white/60 text-xs mt-1 line-clamp-2">
                                              {exercise.description}
                                            </p>
                                            <div className="flex gap-1 mt-2">
                                              <Badge className="bg-white/10 text-white/60 text-xs">
                                                {exercise.equipment}
                                              </Badge>
                                              <Badge className="bg-white/10 text-white/60 text-xs">
                                                {exercise.difficulty}
                                              </Badge>
                                            </div>
                                          </div>
                                          {isSelected(exercise) && (
                                            <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                                              <Plus className="w-4 h-4 text-white rotate-45" />
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-white/40 text-sm text-center">
                      Coming soon
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {isLoading && (
        <div className="text-center py-12 text-white/40">
          Loading exercise library...
        </div>
      )}
    </div>
  );
}