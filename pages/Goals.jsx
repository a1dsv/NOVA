import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Dumbbell, Activity, Swords, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SetGoalModal from '@/components/goals/SetGoalModal';
import GoalProgressCard from '@/components/goals/GoalProgressCard';
import NutritionPreFlightWindow from '@/components/nutrition/NutritionPreFlightWindow';
import HybridBalanceRadar from '@/components/goals/HybridBalanceRadar';
import BenchmarkLevels from '@/components/goals/BenchmarkLevels';

export default function Goals() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [showNutritionGoals, setShowNutritionGoals] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Fetch goals
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allGoals = await base44.entities.Goal.list('-created_date', 100);
      return allGoals.filter(g => g.user_id === user.id);
    },
    enabled: !!user
  });

  // Fetch user nutrition goals
  const { data: nutritionGoals } = useQuery({
    queryKey: ['user-nutrition-goals', user?.id],
    queryFn: async () => {
      const userData = await base44.auth.me();
      return {
        calorie_target: userData.calorie_target,
        protein_target: userData.protein_target,
        carbs_target: userData.carbs_target,
        fat_target: userData.fat_target,
        fiber_target: userData.fiber_target,
        selected_presets: userData.selected_presets
      };
    },
    enabled: !!user
  });

  const hasNutritionGoals = nutritionGoals?.calorie_target || nutritionGoals?.protein_target;

  // Auto-sync goals with workout and meal data
  useEffect(() => {
    const syncGoals = async () => {
      if (!user) return;
      try {
        await base44.functions.invoke('syncGoals');
        queryClient.invalidateQueries(['goals']);
      } catch (error) {
        console.error('Failed to sync goals:', error);
      }
    };

    // Sync on mount and every 30 seconds
    syncGoals();
    const interval = setInterval(syncGoals, 30000);
    return () => clearInterval(interval);
  }, [user, queryClient]);

  // Create goal
  const createGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      return base44.entities.Goal.create({
        ...goalData,
        user_id: user.id,
        current_value: goalData.start_value || 0,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowModal(false);
      setEditGoal(null);
    }
  });

  // Update goal
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Goal.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowModal(false);
      setEditGoal(null);
    }
  });

  // Delete goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.Goal.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });

  const saveNutritionGoalsMutation = useMutation({
    mutationFn: async (goals) => {
      await base44.auth.updateMe(goals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-nutrition-goals']);
      setShowNutritionGoals(false);
    }
  });

  const handleSaveNutritionGoals = (goals) => {
    saveNutritionGoalsMutation.mutate(goals);
  };

  const handleSaveGoal = (goalData) => {
    if (editGoal) {
      updateGoalMutation.mutate({ id: editGoal.id, data: goalData });
    } else {
      createGoalMutation.mutate(goalData);
    }
  };

  const disciplines = [
    { id: 'all', name: 'All', icon: Target },
    { id: 'strength', name: 'Strength', icon: Dumbbell },
    { id: 'endurance', name: 'Endurance', icon: Activity },
    { id: 'combat', name: 'Combat', icon: Swords },
    { id: 'nutrition', name: 'Nutrition', icon: Leaf }
  ];

  const filteredGoals = goals.filter(g => {
    if (disciplineFilter === 'all') return true;
    return g.discipline === disciplineFilter;
  });

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl nova-gradient flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Multi-Discipline Goals</h1>
                  <p className="text-white/40 text-xs uppercase tracking-widest">Hybrid Athlete</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setEditGoal(null);
                  setShowModal(true);
                }}
                className="nova-gradient w-10 h-10 p-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Nutrition Goals Banner */}
            {hasNutritionGoals ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-green-400 font-semibold text-sm mb-1">Nutrition Goals Set</div>
                    <div className="text-white/60 text-xs">
                      {nutritionGoals.calorie_target} cal • {nutritionGoals.protein_target}g protein
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowNutritionGoals(true)}
                    size="sm"
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowNutritionGoals(true)}
                className="w-full h-12 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-400 font-semibold mb-4"
              >
                <Leaf className="w-4 h-4 mr-2" />
                Set Nutrition Goals
              </Button>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/40 text-xs mb-1">Active</p>
                <p className="text-cyan-400 font-bold text-lg">{activeGoals.length}</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/40 text-xs mb-1">Completed</p>
                <p className="text-green-400 font-bold text-lg">{completedGoals.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hybrid Balance Radar */}
        <div className="px-4 py-4">
          <HybridBalanceRadar user={user} />
        </div>

        {/* Benchmark Levels */}
        <div className="px-4 py-4">
          <BenchmarkLevels user={user} />
        </div>

        {/* Discipline Filter */}
        <div className="px-4 py-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {disciplines.map((disc) => {
              const Icon = disc.icon;
              const isActive = disciplineFilter === disc.id;
              return (
                <button
                  key={disc.id}
                  onClick={() => setDisciplineFilter(disc.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {disc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Goals List */}
        <div className="px-4 space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full nova-gradient mx-auto mb-4 flex items-center justify-center">
                {disciplineFilter !== 'all' ? (
                  React.createElement(disciplines.find(d => d.id === disciplineFilter)?.icon || Target, { className: "w-10 h-10 text-white" })
                ) : (
                  <Target className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="text-white font-bold text-xl mb-2">
                No {disciplineFilter !== 'all' ? disciplines.find(d => d.id === disciplineFilter)?.name : ''} Goals Yet
              </h3>
              <p className="text-white/40 mb-6">
                Set a goal and start tracking your progress
              </p>
              <Button
                onClick={() => {
                  setEditGoal(null);
                  setShowModal(true);
                }}
                className="nova-gradient"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Goal
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredGoals.map((goal, idx) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GoalProgressCard
                    goal={goal}
                    onEdit={(g) => {
                      setEditGoal(g);
                      setShowModal(true);
                    }}
                    onDelete={(id) => deleteGoalMutation.mutate(id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Set Goal Modal */}
      <SetGoalModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditGoal(null);
        }}
        onSave={handleSaveGoal}
        user={user}
        editGoal={editGoal}
      />

      {/* Nutrition Goals Window */}
      {showNutritionGoals && (
        <NutritionPreFlightWindow
          onSave={handleSaveNutritionGoals}
          onClose={() => setShowNutritionGoals(false)}
          currentGoals={nutritionGoals}
        />
      )}
    </div>
  );
}