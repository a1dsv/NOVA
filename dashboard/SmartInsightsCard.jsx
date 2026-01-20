import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertCircle, Flame, Droplet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SmartInsightsCard({ user }) {
  // Fetch recent workouts (last 14 days)
  const { data: workouts = [] } = useQuery({
    queryKey: ['recent-workouts', user?.id],
    queryFn: async () => {
      const all = await base44.entities.Workout.filter({ user_id: user.id }, '-created_date', 100);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      return all.filter(w => new Date(w.created_date) > twoWeeksAgo);
    },
    enabled: !!user
  });

  // Fetch recent meals (last 7 days)
  const { data: meals = [] } = useQuery({
    queryKey: ['recent-meals', user?.id],
    queryFn: async () => {
      const all = await base44.entities.Meal.filter({ user_id: user.id }, '-created_date', 100);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return all.filter(m => new Date(m.created_date) > oneWeekAgo);
    },
    enabled: !!user
  });

  if (!user) {
    return null;
  }

  const generateInsights = () => {
    const insights = [];
    
    // Check if user has nutrition goals
    const isBulking = user.selected_presets?.includes('bulking');
    const isCutting = user.selected_presets?.includes('cutting');
    const isKeto = user.selected_presets?.includes('keto');
    
    // Calculate endurance volume (last 7 days)
    const lastWeek = workouts.filter(w => new Date(w.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const enduranceWorkouts = lastWeek.filter(w => w.workout_type === 'run');
    const totalEnduranceMins = enduranceWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    
    // Calculate strength volume
    const strengthWorkouts = lastWeek.filter(w => w.workout_type === 'gym');
    const avgVolume = strengthWorkouts.length > 0 
      ? strengthWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / strengthWorkouts.length 
      : 0;
    
    // Get older strength workouts for comparison
    const olderWorkouts = workouts.filter(w => {
      const date = new Date(w.created_date);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return date > twoWeeksAgo && date < oneWeekAgo && w.workout_type === 'gym';
    });
    const oldAvgVolume = olderWorkouts.length > 0
      ? olderWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / olderWorkouts.length
      : avgVolume;
    
    // Macro-Training Alignment: Bulking + High Cardio
    if (isBulking && totalEnduranceMins > 150) {
      insights.push({
        type: 'warning',
        icon: TrendingUp,
        color: 'amber',
        title: 'High Cardio Volume Detected',
        message: `${totalEnduranceMins} min of cardio this week. Consider increasing daily calories by 300-500 to maintain bulking goals.`
      });
    }
    
    // Macro-Training Alignment: Cutting + Strength Drop
    if (isCutting && avgVolume < oldAvgVolume * 0.85 && oldAvgVolume > 0) {
      const dropPercent = Math.round(((oldAvgVolume - avgVolume) / oldAvgVolume) * 100);
      insights.push({
        type: 'alert',
        icon: TrendingDown,
        color: 'red',
        title: 'Strength Performance Declining',
        message: `${dropPercent}% drop in training volume. Increase protein to ${user.protein_target + 20}g or slow weight loss rate.`
      });
    }
    
    // Recovery Gaps
    const recoveryWorkouts = workouts.filter(w => w.workout_type === 'recovery');
    const lastRecovery = recoveryWorkouts.length > 0 
      ? new Date(recoveryWorkouts[0].created_date)
      : null;
    const daysSinceRecovery = lastRecovery 
      ? Math.floor((Date.now() - lastRecovery.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceRecovery > 4 && lastWeek.length > 3) {
      insights.push({
        type: 'info',
        icon: Droplet,
        color: 'cyan',
        title: 'Recovery Deficit Found',
        message: `${daysSinceRecovery} days since last recovery session. Add 10-min stretching or sauna to stay on track.`
      });
    }
    
    // Condition Awareness
    const recentCompromised = lastWeek.filter(w => w.condition === 'compromised');
    if (recentCompromised.length > 0) {
      insights.push({
        type: 'info',
        icon: AlertCircle,
        color: 'violet',
        title: 'Fatigue Management',
        message: `${recentCompromised.length} compromised session${recentCompromised.length > 1 ? 's' : ''} detected. Consider aiming for 85-90% intensity for better long-term consistency.`
      });
    }
    
    // Keto tracking
    if (isKeto && meals.length > 0) {
      const avgDailyCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0) / 7;
      if (avgDailyCarbs > 50) {
        insights.push({
          type: 'warning',
          icon: Flame,
          color: 'orange',
          title: 'Carb Intake Above Keto Range',
          message: `Avg ${Math.round(avgDailyCarbs)}g carbs/day. Keep under 50g to maintain ketosis.`
        });
      }
    }
    
    // If no insights, show positive message
    if (insights.length === 0) {
      insights.push({
        type: 'success',
        icon: Brain,
        color: 'green',
        title: 'On Track',
        message: 'Your training and nutrition are well-aligned with your goals. Keep it up!'
      });
    }
    
    return insights;
  };

  const insights = generateInsights();
  
  const colorMap = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' }
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => {
        const Icon = insight.icon;
        const colors = colorMap[insight.color];
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
            whileTap={{ scale: 0.98 }}
            className={`${colors.bg} backdrop-blur-xl border ${colors.border} rounded-xl p-4 shadow-[inset_0_0_15px_rgba(139,92,246,0.08)]`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm mb-1 ${colors.text}`}>
                  {insight.title}
                </h3>
                <p className="text-white/80 text-xs leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}