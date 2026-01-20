import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NutritionWorkoutInsights({ userId, meals, workouts }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['nutrition-insights', userId, meals?.length, workouts?.length],
    queryFn: async () => {
      if (!meals || meals.length === 0) return null;
      
      // Get last 7 days of data
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      const recentMeals = meals.filter(m => new Date(m.meal_date) >= last7Days);
      const recentWorkouts = workouts.filter(w => new Date(w.created_date) >= last7Days);
      
      // Calculate nutrition averages
      const avgCalories = recentMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0) / 7;
      const avgProtein = recentMeals.reduce((sum, m) => sum + (m.total_protein || 0), 0) / 7;
      const avgCarbs = recentMeals.reduce((sum, m) => sum + (m.total_carbs || 0), 0) / 7;
      const avgFat = recentMeals.reduce((sum, m) => sum + (m.total_fat || 0), 0) / 7;
      
      // Workout stats
      const workoutCount = recentWorkouts.length;
      const avgVolume = recentWorkouts
        .filter(w => w.total_volume)
        .reduce((sum, w) => sum + w.total_volume, 0) / (recentWorkouts.filter(w => w.total_volume).length || 1);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the correlation between nutrition and training performance:

NUTRITION (Last 7 days average per day):
- Calories: ${avgCalories.toFixed(0)} cal
- Protein: ${avgProtein.toFixed(0)}g
- Carbs: ${avgCarbs.toFixed(0)}g
- Fat: ${avgFat.toFixed(0)}g

TRAINING (Last 7 days):
- Workout count: ${workoutCount}
- Average volume: ${avgVolume.toFixed(0)} lbs (if strength training)
- Types: ${[...new Set(recentWorkouts.map(w => w.workout_type))].join(', ')}

Provide:
1. Overall assessment (excellent/good/needs_improvement)
2. Key insight about nutrition-performance correlation
3. Specific macro recommendations for their training volume
4. One actionable tip to optimize performance
5. Highlight any red flags (e.g., low protein with high volume training)`,
        response_json_schema: {
          type: "object",
          properties: {
            assessment: {
              type: "string",
              enum: ["excellent", "good", "needs_improvement"]
            },
            key_insight: { type: "string" },
            macro_recommendation: { type: "string" },
            actionable_tip: { type: "string" },
            red_flags: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["assessment", "key_insight", "actionable_tip"]
        }
      });
      
      return response;
    },
    enabled: !!userId && meals?.length > 0 && workouts?.length > 0,
    staleTime: 1000 * 60 * 30 // Cache for 30 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
          <h3 className="text-white font-bold">AI Nutrition Insights</h3>
        </div>
        <p className="text-white/60 text-sm">Analyzing your nutrition and training data...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h3 className="text-white font-bold">AI Nutrition Insights</h3>
        </div>
        <p className="text-white/60 text-sm">Log meals and workouts to get personalized insights</p>
      </div>
    );
  }

  const assessmentConfig = {
    excellent: { color: 'green', icon: CheckCircle2, text: 'Excellent' },
    good: { color: 'cyan', icon: TrendingUp, text: 'Good' },
    needs_improvement: { color: 'amber', icon: AlertCircle, text: 'Needs Improvement' }
  };

  const config = assessmentConfig[insights.assessment] || assessmentConfig.good;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h3 className="text-white font-bold">AI Nutrition-Performance Insights</h3>
      </div>

      {/* Assessment Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${config.color}-500/20 border border-${config.color}-500/30`}>
          <Icon className={`w-4 h-4 text-${config.color}-400`} />
          <span className={`text-${config.color}-400 font-semibold text-sm`}>{config.text}</span>
        </div>
      </div>

      {/* Key Insight */}
      <div className="bg-black/30 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5" />
          <p className="text-white/90 text-sm leading-relaxed">{insights.key_insight}</p>
        </div>
      </div>

      {/* Macro Recommendation */}
      {insights.macro_recommendation && (
        <div className="bg-black/30 rounded-xl p-4 mb-4">
          <p className="text-white/60 text-xs uppercase mb-2">Macro Recommendation</p>
          <p className="text-white/90 text-sm">{insights.macro_recommendation}</p>
        </div>
      )}

      {/* Red Flags */}
      {insights.red_flags && insights.red_flags.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 font-semibold text-sm">Areas to Address</p>
          </div>
          <ul className="space-y-1">
            {insights.red_flags.map((flag, idx) => (
              <li key={idx} className="text-white/80 text-sm">• {flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Tip */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-cyan-400 mt-0.5" />
          <div>
            <p className="text-cyan-400 font-semibold text-xs uppercase mb-1">Action Step</p>
            <p className="text-white/90 text-sm">{insights.actionable_tip}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}