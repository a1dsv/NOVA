import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NutritionHistoryModal({ user, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const queryClient = useQueryClient();

  const { data: meals = [] } = useQuery({
    queryKey: ['meals', user?.id],
    queryFn: () => base44.entities.Meal.filter({ user_id: user?.id }, '-created_date', 200),
    enabled: !!user
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
        water_target: userData.water_target || 2.5
      };
    },
    enabled: !!user
  });

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

  // Calculate daily totals and goal proximity
  const dailyData = useMemo(() => {
    const data = {};
    meals.forEach((meal) => {
      const date = meal.meal_date;
      if (!data[date]) {
        data[date] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          water: 0,
          meals: []
        };
      }
      data[date].calories += meal.total_calories || 0;
      data[date].protein += meal.total_protein || 0;
      data[date].carbs += meal.total_carbs || 0;
      data[date].fat += meal.total_fat || 0;
      data[date].fiber += meal.total_fiber || 0;
      data[date].water += meal.water_ml || 0;
      if (meal.meal_type !== 'water') {
        data[date].meals.push(meal);
      }
    });

    // Calculate goal proximity (0-100, where 100 is perfect)
    Object.keys(data).forEach((date) => {
      const day = data[date];
      const scores = [];
      
      if (userGoals) {
        // Calorie score (within 10% is perfect)
        const calorieRatio = day.calories / userGoals.calorie_target;
        scores.push(calorieRatio >= 0.9 && calorieRatio <= 1.1 ? 100 : Math.max(0, 100 - Math.abs(calorieRatio - 1) * 200));
        
        // Protein score
        const proteinRatio = day.protein / userGoals.protein_target;
        scores.push(proteinRatio >= 0.9 && proteinRatio <= 1.1 ? 100 : Math.max(0, 100 - Math.abs(proteinRatio - 1) * 200));
        
        // Fiber score
        const fiberRatio = day.fiber / userGoals.fiber_target;
        scores.push(fiberRatio >= 0.9 && fiberRatio <= 1.1 ? 100 : Math.max(0, 100 - Math.abs(fiberRatio - 1) * 200));
        
        // Water score
        const waterRatio = (day.water / 1000) / userGoals.water_target;
        scores.push(waterRatio >= 0.9 && waterRatio <= 1.1 ? 100 : Math.max(0, 100 - Math.abs(waterRatio - 1) * 200));
      }
      
      day.goalProximity = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
    });

    return data;
  }, [meals, userGoals]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getHeatmapColor = (proximity) => {
    if (proximity >= 90) return 'bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.6)]';
    if (proximity >= 70) return 'bg-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
    if (proximity >= 50) return 'bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    if (proximity >= 30) return 'bg-emerald-500/20';
    return 'bg-white/5';
  };

  const selectedDayData = selectedDate ? dailyData[selectedDate] : null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 rounded-2xl border border-white/20 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-2xl uppercase tracking-wider">Nutrition History</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <h3 className="text-white font-bold text-lg">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={nextMonth} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-white/40 text-xs font-semibold text-center pb-2">
              {day}
            </div>
          ))}
          
          {[...Array(firstDayOfMonth)].map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = dailyData[dateStr];
            const hasData = dayData && dayData.meals.length > 0;
            
            return (
              <motion.button
                key={day}
                onClick={() => hasData && setSelectedDate(dateStr)}
                whileTap={{ scale: 0.95 }}
                className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                  hasData
                    ? `${getHeatmapColor(dayData.goalProximity)} text-white cursor-pointer hover:scale-105`
                    : 'bg-white/5 text-white/20 cursor-default'
                }`}
              >
                {day}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
            <span className="text-white/60 text-xs">Perfect</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/40" />
            <span className="text-white/60 text-xs">Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/5" />
            <span className="text-white/60 text-xs">No Data</span>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDayData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-6"
          >
            <h4 className="text-white font-bold text-lg mb-4">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>

            {/* Goal Comparison */}
            {userGoals && (
              <div className="bg-black/40 rounded-xl p-4 mb-6">
                <h5 className="text-white/60 text-xs uppercase tracking-wider font-semibold mb-3">Goal Comparison</h5>
                <div className="space-y-3">
                  {/* Calories */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Calories</span>
                      <span className="text-emerald-400 text-sm font-bold font-mono">
                        {selectedDayData.calories} / {userGoals.calorie_target}
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 border border-emerald-500/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((selectedDayData.calories / userGoals.calorie_target) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Protein */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Protein</span>
                      <span className="text-cyan-400 text-sm font-bold font-mono">
                        {selectedDayData.protein}g / {userGoals.protein_target}g
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 border border-cyan-500/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((selectedDayData.protein / userGoals.protein_target) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(0, 210, 255, 0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Carbs</span>
                      <span className="text-orange-400 text-sm font-bold font-mono">
                        {selectedDayData.carbs}g / {userGoals.carbs_target}g
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 border border-orange-500/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((selectedDayData.carbs / userGoals.carbs_target) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(251, 146, 60, 0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Fats */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Fats</span>
                      <span className="text-amber-400 text-sm font-bold font-mono">
                        {selectedDayData.fat}g / {userGoals.fat_target}g
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 border border-amber-500/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((selectedDayData.fat / userGoals.fat_target) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Fiber */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Fiber</span>
                      <span className="text-green-400 text-sm font-bold font-mono">
                        {selectedDayData.fiber}g / {userGoals.fiber_target}g
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 border border-green-500/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((selectedDayData.fiber / userGoals.fiber_target) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Water */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Water</span>
                      <span className="text-cyan-400 text-sm font-bold font-mono">
                        {(selectedDayData.water / 1000).toFixed(1)}L / {userGoals.water_target}L
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 border border-cyan-500/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((selectedDayData.water / 1000) / userGoals.water_target) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(0, 210, 255, 0.5)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Totals */}
            <div className="grid grid-cols-6 gap-3 mb-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <p className="text-emerald-400 font-mono text-lg font-bold">{selectedDayData.calories}</p>
                <p className="text-emerald-400/60 text-[10px] uppercase mt-1">Cal</p>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                <p className="text-cyan-400 font-mono text-lg font-bold">{selectedDayData.protein}g</p>
                <p className="text-cyan-400/60 text-[10px] uppercase mt-1">P</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                <p className="text-orange-400 font-mono text-lg font-bold">{selectedDayData.carbs}g</p>
                <p className="text-orange-400/60 text-[10px] uppercase mt-1">C</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                <p className="text-amber-400 font-mono text-lg font-bold">{selectedDayData.fat}g</p>
                <p className="text-amber-400/60 text-[10px] uppercase mt-1">F</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <p className="text-green-400 font-mono text-lg font-bold">{selectedDayData.fiber}g</p>
                <p className="text-green-400/60 text-[10px] uppercase mt-1">Fiber</p>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                <p className="text-cyan-400 font-mono text-lg font-bold">{(selectedDayData.water / 1000).toFixed(1)}L</p>
                <p className="text-cyan-400/60 text-[10px] uppercase mt-1">Water</p>
              </div>
            </div>

            {/* Meals for the Day */}
            <div className="space-y-3">
              <h5 className="text-white/60 text-xs uppercase tracking-wider font-semibold">Meals</h5>
              {selectedDayData.meals.map((meal) => (
                <div key={meal.id} className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {meal.proof_photo_url && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/30">
                        <img src={meal.proof_photo_url} alt="Meal" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h6 className="text-white font-bold text-sm capitalize">{meal.meal_type}</h6>
                      <p className="text-white/40 text-xs font-mono">
                        {new Date(meal.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>

                  {meal.items && meal.items.length > 0 && (
                    <div className="space-y-2">
                      {meal.items.map((item, idx) => (
                        <div key={idx} className="bg-black/20 rounded-lg p-2">
                          <p className="text-white text-xs font-semibold mb-1">{item.name}</p>
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
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}