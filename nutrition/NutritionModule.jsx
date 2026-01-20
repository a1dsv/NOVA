import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Camera, Trash2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NutritionStats from './NutritionStats';
import LogMealModal from './LogMealModal';
import NutritionPreFlightWindow from './NutritionPreFlightWindow';
import PlantDiversityTracker from './PlantDiversityTracker';
import NutritionHistoryModal from './NutritionHistoryModal';
import useStickyState from '@/components/hooks/useStickyState';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function NutritionModule({ user }) {
  const [showLogMeal, setShowLogMeal] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showDayFinalize, setShowDayFinalize] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWaterAnimation, setShowWaterAnimation] = useState(false);
  const [dailyLog, setDailyLog] = useStickyState('nova_daily_nutrition', []);
  
  const queryClient = useQueryClient();

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ['meals', user?.id],
    queryFn: () => base44.entities.Meal.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: userGoals } = useQuery({
    queryKey: ['user-nutrition-goals', user?.id],
    queryFn: async () => {
      const userData = await base44.auth.me();
      return {
        calorie_target: userData.calorie_target || 2000,
        protein_target: userData.protein_target || 150,
        carbs_target: userData.carbs_target || 200,
        fat_target: userData.fat_target || 65,
        fiber_target: userData.fiber_target || 30,
        water_target: userData.water_target || 2.5,
        nutrition_goal_mode: userData.nutrition_goal_mode || 'maintaining',
        plant_diversity_weekly: userData.plant_diversity_weekly || []
      };
    },
    enabled: !!user
  });

  // Sync daily log to localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      if (dailyLog.length > 0) {
        localStorage.setItem('nova_daily_nutrition', JSON.stringify(dailyLog));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [dailyLog]);

  // Calculate today's totals
  const today = new Date().toDateString();
  const todayMeals = meals.filter(m => new Date(m.meal_date).toDateString() === today);
  const todayTotals = todayMeals.reduce((acc, meal) => {
    // Calculate fiber from both total_fiber and items array
    let mealFiber = meal.total_fiber || 0;
    if (meal.items && meal.items.length > 0) {
      mealFiber += meal.items.reduce((sum, item) => sum + (item.fiber || 0), 0);
    }

    return {
      calories: acc.calories + (meal.total_calories || 0),
      protein: acc.protein + (meal.total_protein || 0),
      carbs: acc.carbs + (meal.total_carbs || 0),
      fat: acc.fat + (meal.total_fat || 0),
      fiber: acc.fiber + mealFiber,
      water: acc.water + (meal.water_ml || 0)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0 });

  // Calculate plant diversity this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekMeals = meals.filter(m => new Date(m.meal_date) >= weekStart);
  const plantItems = new Set();
  weekMeals.forEach(meal => {
    if (meal.items) {
      meal.items.filter(item => item.is_plant_based).forEach(item => {
        plantItems.add(item.name.toLowerCase());
      });
    }
  });
  const plantPoints = plantItems.size;

  const caloriesRemaining = (userGoals?.calorie_target || 2000) - todayTotals.calories;
  const proteinRemaining = (userGoals?.protein_target || 150) - todayTotals.protein;

  const saveGoalsMutation = useMutation({
    mutationFn: async (goals) => {
      await base44.auth.updateMe(goals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-nutrition-goals']);
      setShowGoals(false);
    }
  });

  const handleSaveGoals = (goals) => {
    saveGoalsMutation.mutate(goals);
  };

  const handleFinalizeDay = () => {
    setShowDayFinalize(true);
  };

  const deleteMealMutation = useMutation({
    mutationFn: (mealId) => base44.entities.Meal.delete(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries(['meals']);
    }
  });

  const handleDeleteMeal = (mealId) => {
    if (confirm('Are you sure you want to delete this meal?')) {
      deleteMealMutation.mutate(mealId);
    }
  };

  const recentMeals = meals.filter(m => m.meal_type !== 'water').slice(0, 5);

  return (
    <div className="space-y-6 relative">
      {/* Tactical Add Meal Bar */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => setShowLogMeal(true)}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex-1 h-16 bg-white/5 backdrop-blur-xl border border-emerald-500/30 rounded-xl flex items-center justify-center gap-3 hover:bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plus className="w-6 h-6 text-emerald-400 glow-recovery" />
          </motion.div>
          <span className="text-emerald-400 font-bold tracking-wider uppercase text-sm">Add Meal</span>
        </motion.button>
        
        <motion.button
          onClick={async () => {
            setShowWaterAnimation(true);
            await base44.entities.Meal.create({
              user_id: user.id,
              meal_type: 'water',
              meal_date: new Date().toISOString().split('T')[0],
              water_ml: 250,
              total_calories: 0,
              total_protein: 0,
              total_carbs: 0,
              total_fat: 0,
              total_fiber: 0,
              items: []
            });
            queryClient.invalidateQueries(['meals']);
            queryClient.invalidateQueries(['user-nutrition-goals']);
            setTimeout(() => setShowWaterAnimation(false), 1000);
          }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-16 h-16 bg-white/5 backdrop-blur-xl border border-cyan-500/30 rounded-xl flex items-center justify-center hover:bg-cyan-500/10 shadow-[0_0_25px_rgba(0,210,255,0.2)]"
        >
          <span className="text-cyan-400 text-2xl">💧</span>
          {showWaterAnimation && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -40, scale: 1.2 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="text-cyan-400 font-bold text-sm">+250ml</span>
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Today's Progress Hub - System Status */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {/* Calorie Hub - Large Monospace Readout */}
        <div className="mb-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">Kcal Remaining</p>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="text-emerald-400 text-7xl font-bold font-mono neon-data"
            style={{ filter: 'drop-shadow(0 0 12px #10b981)' }}
          >
            {Math.max(0, (userGoals?.calorie_target || 2000) - todayTotals.calories)}
          </motion.div>
          <p className="text-white/40 text-sm font-mono mt-2">{todayTotals.calories} / {userGoals?.calorie_target || 2000} consumed</p>
        </div>

        {/* Macro Gauges - Glass Tubes */}
        <div className="space-y-4 mb-6">
          {/* Protein - Blue */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Protein</span>
              <span className="text-cyan-400 text-sm font-bold font-mono">{todayTotals.protein}g / {userGoals?.protein_target || 150}g</span>
            </div>
            <div className="w-full bg-black/40 backdrop-blur-xl rounded-full h-4 border border-cyan-500/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((todayTotals.protein / (userGoals?.protein_target || 150)) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                style={{ boxShadow: '0 0 15px rgba(0, 210, 255, 0.5)' }}
              />
            </div>
          </div>

          {/* Carbs - Orange */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Carbs</span>
              <span className="text-orange-400 text-sm font-bold font-mono">{todayTotals.carbs}g / {userGoals?.carbs_target || 250}g</span>
            </div>
            <div className="w-full bg-black/40 backdrop-blur-xl rounded-full h-4 border border-orange-500/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((todayTotals.carbs / (userGoals?.carbs_target || 250)) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                style={{ boxShadow: '0 0 15px rgba(251, 146, 60, 0.5)' }}
              />
            </div>
          </div>

          {/* Fats - Gold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Fats</span>
              <span className="text-amber-400 text-sm font-bold font-mono">{todayTotals.fat}g / {userGoals?.fat_target || 67}g</span>
            </div>
            <div className="w-full bg-black/40 backdrop-blur-xl rounded-full h-4 border border-amber-500/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((todayTotals.fat / (userGoals?.fat_target || 67)) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{ boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)' }}
              />
            </div>
          </div>

          {/* Fiber - Green */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Fiber</span>
              <span className="text-green-400 text-sm font-bold font-mono">{todayTotals.fiber}g / {userGoals?.fiber_target || 30}g</span>
            </div>
            <div className="w-full bg-black/40 backdrop-blur-xl rounded-full h-4 border border-green-500/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((todayTotals.fiber / (userGoals?.fiber_target || 30)) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
              />
            </div>
          </div>

          {/* Water - Cyan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Water</span>
              <span className="text-cyan-400 text-sm font-bold font-mono">{(todayTotals.water / 1000).toFixed(1)}L / {userGoals?.water_target || 2.5}L</span>
            </div>
            <div className="w-full bg-black/40 backdrop-blur-xl rounded-full h-4 border border-cyan-500/20 overflow-hidden">
              <motion.div
                key={`water-${todayTotals.water}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((todayTotals.water / 1000) / (userGoals?.water_target || 2.5)) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                style={{ boxShadow: '0 0 15px rgba(0, 210, 255, 0.5)' }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={() => setShowGoals(true)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-12 bg-white/5 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl text-xs hover:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)] uppercase tracking-wider"
          >
            {userGoals ? 'Change Goals' : 'Set Goals'}
          </motion.button>
          <motion.button
            onClick={() => setShowHistory(true)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-12 bg-white/5 backdrop-blur-xl border border-cyan-500/30 text-cyan-400 font-semibold rounded-xl text-xs hover:bg-cyan-500/10 shadow-[0_0_15px_rgba(0,210,255,0.2)] uppercase tracking-wider"
          >
            History
          </motion.button>
        </div>
      </div>

      {userGoals?.nutrition_goal_mode === 'plant_diversity' && (
        <PlantDiversityTracker weeklyPoints={plantPoints} />
      )}

      <motion.button
        onClick={handleFinalizeDay}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full h-12 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl flex items-center justify-center"
      >
        <Camera className="w-4 h-4 mr-2" />
        Finalize Day
      </motion.button>

      {/* Recent Meals Feed - Slim Glass Tiles */}
      <div className="space-y-3">
        <h3 className="text-white/40 font-bold text-xs uppercase tracking-widest">Recent Meals</h3>

        {isLoading ? (
          <div className="text-white/40 text-center py-8">Loading...</div>
        ) : recentMeals.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
            <p className="text-white/60">No meals logged yet</p>
            <p className="text-white/40 text-sm mt-2">Start tracking your nutrition</p>
          </div>
        ) : (
          recentMeals.map((meal, idx) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10"
            >
              {/* Header with photo and time */}
              <div className="flex items-center gap-3 mb-3">
                {meal.proof_photo_url && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/30">
                    <img src={meal.proof_photo_url} alt="Meal" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm capitalize">{meal.meal_type}</h4>
                  <p className="text-white/40 text-xs font-mono">
                    {new Date(meal.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    <span className="ml-2 text-emerald-400">{new Date(meal.meal_date).toLocaleDateString()}</span>
                  </p>
                </div>
                <motion.button
                  onClick={() => handleDeleteMeal(meal.id)}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </motion.button>
              </div>

              {/* Individual Foods */}
              {meal.items && meal.items.length > 0 && (
                <div className="space-y-2 mb-3">
                  {meal.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-black/20 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-xs font-semibold">{item.name}</p>
                        {(item.quantity || item.weight_grams) && (
                          <p className="text-white/60 text-[10px]">
                            {item.quantity} {item.weight_grams > 0 && `(${item.weight_grams}g)`}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        <div className="text-center">
                          <p className="text-emerald-400 font-mono text-xs font-bold">{item.calories}</p>
                          <p className="text-emerald-400/60 text-[9px]">Cal</p>
                        </div>
                        <div className="text-center">
                          <p className="text-cyan-400 font-mono text-xs font-bold">{item.protein}g</p>
                          <p className="text-cyan-400/60 text-[9px]">P</p>
                        </div>
                        <div className="text-center">
                          <p className="text-orange-400 font-mono text-xs font-bold">{item.carbs}g</p>
                          <p className="text-orange-400/60 text-[9px]">C</p>
                        </div>
                        <div className="text-center">
                          <p className="text-amber-400 font-mono text-xs font-bold">{item.fat}g</p>
                          <p className="text-amber-400/60 text-[9px]">F</p>
                        </div>
                        <div className="text-center">
                          <p className="text-green-400 font-mono text-xs font-bold">{item.fiber || 0}g</p>
                          <p className="text-green-400/60 text-[9px]">Fib</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Macros */}
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/40 text-[10px] uppercase mb-2">Total</p>
                <div className="grid grid-cols-5 gap-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                    <p className="text-emerald-400 font-mono text-sm font-bold">{meal.total_calories}</p>
                    <p className="text-emerald-400/60 text-[9px] uppercase">Cal</p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-center">
                    <p className="text-cyan-400 font-mono text-sm font-bold">{meal.total_protein}g</p>
                    <p className="text-cyan-400/60 text-[9px] uppercase">P</p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                    <p className="text-orange-400 font-mono text-sm font-bold">{meal.total_carbs}g</p>
                    <p className="text-orange-400/60 text-[9px] uppercase">C</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
                    <p className="text-amber-400 font-mono text-sm font-bold">{meal.total_fat}g</p>
                    <p className="text-amber-400/60 text-[9px] uppercase">F</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                    <p className="text-green-400 font-mono text-sm font-bold">{meal.total_fiber || 0}g</p>
                    <p className="text-green-400/60 text-[9px] uppercase">Fib</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {showHistory && (
        <NutritionHistoryModal user={user} onClose={() => setShowHistory(false)} />
      )}

      {/* Intelligent Footer */}
      <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-4 mt-6 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px #10b981)' }} />
          </div>
          <div className="flex-1">
            <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-1">Fueling Status</h4>
            <p className="text-white/80 text-sm leading-relaxed">
              {todayTotals.calories >= (userGoals?.calorie_target || 2000) * 0.8 
                ? 'Optimized for Recovery'
                : 'Below optimal intake'}
            </p>
            <p className="text-white/40 text-xs font-mono mt-1">
              Total Plants: {plantPoints}/30
            </p>
          </div>
        </div>
      </div>

      {showLogMeal && (
        <LogMealModal
          isOpen={showLogMeal}
          onClose={() => setShowLogMeal(false)}
          onSuccess={() => queryClient.invalidateQueries(['meals'])}
          userId={user.id}
        />
      )}

      {showGoals && (
        <NutritionPreFlightWindow
          onSave={handleSaveGoals}
          onClose={() => setShowGoals(false)}
          currentGoals={userGoals}
        />
      )}

      {showDayFinalize && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white font-bold text-xl mb-4">Finalize Today</h3>
            <p className="text-white/60 mb-6">
              Take a photo of your best meal or your physical progress today!
            </p>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      await base44.entities.Meal.create({
                        user_id: user.id,
                        meal_type: 'day_finalize',
                        meal_date: new Date().toISOString(),
                        total_calories: todayTotals.calories,
                        total_protein: todayTotals.protein,
                        total_carbs: todayTotals.carbs,
                        total_fat: todayTotals.fat,
                        proof_photo_url: file_url,
                        notes: 'End of day photo proof'
                      });
                      setDailyLog([]);
                      localStorage.removeItem('nova_daily_nutrition');
                      setShowDayFinalize(false);
                      alert('Day finalized! Great work! 🎉');
                    } catch (err) {
                      alert('Failed to upload photo');
                    }
                  }
                }}
                className="hidden"
                id="day-photo"
              />
              <label htmlFor="day-photo">
                <Button className="w-full h-14 nova-gradient" asChild>
                  <span>
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </span>
                </Button>
              </label>
              <Button
                onClick={() => {
                  setDailyLog([]);
                  localStorage.removeItem('nova_daily_nutrition');
                  setShowDayFinalize(false);
                }}
                variant="outline"
                className="w-full"
              >
                Skip Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}