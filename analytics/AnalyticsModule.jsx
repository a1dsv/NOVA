import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Activity, Apple } from 'lucide-react';
import WorkoutDistributionChart from './WorkoutDistributionChart';
import VolumeProgressChart from './VolumeProgressChart';
import ConsistencyBarChart from './ConsistencyBarChart';
import NutritionAnalyticsChart from './NutritionAnalyticsChart';

export default function AnalyticsModule({ user }) {
  const [viewType, setViewType] = useState('workout'); // workout or nutrition

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['workouts-analytics', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user && viewType === 'workout',
    initialData: []
  });

  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ['meals-analytics', user?.id],
    queryFn: () => base44.entities.Meal.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user && viewType === 'nutrition',
    initialData: []
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <motion.button
          onClick={() => setViewType('workout')}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-xl border transition-all ${
            viewType === 'workout'
              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
              : 'bg-white/5 border-white/10 text-white/40'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="font-semibold">Workouts</span>
        </motion.button>
        
        <motion.button
          onClick={() => setViewType('nutrition')}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-xl border transition-all ${
            viewType === 'nutrition'
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : 'bg-white/5 border-white/10 text-white/40'
          }`}
        >
          <Apple className="w-5 h-5" />
          <span className="font-semibold">Nutrition</span>
        </motion.button>
      </div>

      {viewType === 'workout' && (
        <>
          {workoutsLoading ? (
            <div className="text-white/40 text-center py-12">Loading analytics...</div>
          ) : workouts.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
              <p className="text-white/60">No workout data yet</p>
              <p className="text-white/40 text-sm mt-2">Complete workouts to see analytics</p>
            </div>
          ) : (
            <div className="space-y-6">
              <WorkoutDistributionChart workouts={workouts} />
              <ConsistencyBarChart workouts={workouts} />
              <VolumeProgressChart workouts={workouts} />
            </div>
          )}
        </>
      )}

      {viewType === 'nutrition' && (
        <>
          {mealsLoading ? (
            <div className="text-white/40 text-center py-12">Loading analytics...</div>
          ) : meals.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
              <p className="text-white/60">No nutrition data yet</p>
              <p className="text-white/40 text-sm mt-2">Log meals to see analytics</p>
            </div>
          ) : (
            <div className="space-y-6">
              <NutritionAnalyticsChart meals={meals} />
            </div>
          )}
        </>
      )}
    </div>
  );
}