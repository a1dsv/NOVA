import React from 'react';
import { motion } from 'framer-motion';
import { Apple, TrendingUp, Flame, Target } from 'lucide-react';

export default function NutritionStats({ meals, targetCalories = 2500 }) {
  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals.filter(m => m.meal_date === today);
  
  const totals = {
    calories: todaysMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0),
    protein: todaysMeals.reduce((sum, m) => sum + (m.total_protein || 0), 0),
    carbs: todaysMeals.reduce((sum, m) => sum + (m.total_carbs || 0), 0),
    fat: todaysMeals.reduce((sum, m) => sum + (m.total_fat || 0), 0)
  };

  const calorieProgress = (totals.calories / targetCalories) * 100;

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Apple className="w-5 h-5 text-green-400" />
          Today's Nutrition
        </h3>
        <div className="text-white/60 text-xs">
          {todaysMeals.length} meal{todaysMeals.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Calories Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">Calories</span>
          <span className="text-white font-bold">{totals.calories.toFixed(0)} / {targetCalories}</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(calorieProgress, 100)}%` }}
            className={`h-full ${
              calorieProgress > 100 
                ? 'bg-red-500' 
                : calorieProgress > 80 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-green-500 to-cyan-500'
            }`}
          />
        </div>
        <p className="text-white/40 text-xs mt-1">
          {calorieProgress > 100 ? (
            <span className="text-red-400">Over target by {(totals.calories - targetCalories).toFixed(0)} cal</span>
          ) : (
            <span>{(targetCalories - totals.calories).toFixed(0)} cal remaining</span>
          )}
        </p>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Protein</p>
          <p className="text-violet-400 font-bold text-xl">{totals.protein.toFixed(0)}g</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Carbs</p>
          <p className="text-amber-400 font-bold text-xl">{totals.carbs.toFixed(0)}g</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Fat</p>
          <p className="text-green-400 font-bold text-xl">{totals.fat.toFixed(0)}g</p>
        </div>
      </div>
    </div>
  );
}