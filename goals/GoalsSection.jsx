import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Dumbbell, Activity, Swords, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SetGoalModal from '@/components/goals/SetGoalModal';
import GoalProgressCard from '@/components/goals/GoalProgressCard';
import NutritionPreFlightWindow from '@/components/nutrition/NutritionPreFlightWindow';
import CoachInsightCard from '@/components/coach/CoachInsightCard';

export default function GoalsSection({ user }) {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showNutritionGoals, setShowNutritionGoals] = useState(false);
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch user goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: user.id }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  // Fetch nutrition goals status
  const { data: hasNutritionGoals = false } = useQuery({
    queryKey: ['has-nutrition-goals', user?.id],
    queryFn: async () => {
      const userData = await base44.auth.me();
      return !!(userData.calorie_target || userData.protein_target);
    },
    enabled: !!user
  });

  // Auto-sync goals with workout/meal data
  useEffect(() => {
    const syncGoals = async () => {
      if (!user) return;
      try {
        await base44.functions.invoke('syncGoals', {});
        queryClient.invalidateQueries(['goals']);
      } catch (error) {
        console.error('Failed to sync goals:', error);
      }
    };

    syncGoals();
    const interval = setInterval(syncGoals, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [user, queryClient]);

  const createGoalMutation = useMutation({
    mutationFn: (goalData) => base44.entities.Goal.create({ ...goalData, user_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowGoalModal(false);
      setEditingGoal(null);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowGoalModal(false);
      setEditingGoal(null);
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });

  const handleSaveGoal = (goalData) => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      createGoalMutation.mutate(goalData);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const handleDeleteGoal = (id) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoalMutation.mutate(id);
    }
  };

  const disciplines = [
    { id: 'all', name: 'All', icon: null },
    { id: 'strength', name: 'Strength', icon: Dumbbell },
    { id: 'endurance', name: 'Endurance', icon: Activity },
    { id: 'combat', name: 'Combat', icon: Swords },
    { id: 'nutrition', name: 'Nutrition', icon: Leaf }
  ];

  const filteredGoals = disciplineFilter === 'all' 
    ? goals 
    : goals.filter(g => g.discipline === disciplineFilter);

  const activeGoals = filteredGoals.filter(g => g.status === 'active');

  return (
    <div className="space-y-6">
      {/* Coach Insights */}
      <CoachInsightCard user={user} />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          onClick={() => {
            setEditingGoal(null);
            setShowGoalModal(true);
          }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-12 bg-violet-500/20 border border-violet-500/30 hover:bg-violet-500/30 text-violet-400 font-semibold rounded-xl flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </motion.button>
        <motion.button
          onClick={() => setShowNutritionGoals(true)}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-12 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 font-semibold rounded-xl flex items-center justify-center"
        >
          <Leaf className="w-4 h-4 mr-2" />
          Nutrition Goals
        </motion.button>
      </div>

      {/* Discipline Filter */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {disciplines.map((disc) => {
            const Icon = disc.icon;
            const isActive = disciplineFilter === disc.id;
            return (
              <motion.button
                key={disc.id}
                onClick={() => setDisciplineFilter(disc.id)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {disc.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="text-center py-12 text-white/40">Loading goals...</div>
      ) : activeGoals.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-white font-bold mb-2">No Active Goals</h3>
          <p className="text-white/60 text-sm mb-4">
            Set your first goal to track your progress
          </p>
          <motion.button
            onClick={() => setShowGoalModal(true)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="nova-gradient text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </motion.button>
        </div>
      ) : (
        <motion.div 
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          <AnimatePresence>
            {activeGoals.map(goal => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      {showGoalModal && (
        <SetGoalModal
          goal={editingGoal}
          onSave={handleSaveGoal}
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
        />
      )}

      {showNutritionGoals && (
        <NutritionPreFlightWindow
          onSave={async (goals) => {
            await base44.auth.updateMe(goals);
            queryClient.invalidateQueries(['has-nutrition-goals']);
            setShowNutritionGoals(false);
          }}
          onClose={() => setShowNutritionGoals(false)}
          currentGoals={user}
        />
      )}
    </div>
  );
}