import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, TrendingUp, Activity, Target, Zap, Flame, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { calculateReadiness, getReadinessStatus } from '@/components/performanceEngine';
import { Button } from '@/components/ui/button';

export default function CoachInsightCard({ user, readinessData, overallStatus }) {
  const [currentCard, setCurrentCard] = useState(0);
  // Fetch recent workouts (last 30 days)
  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ['workouts-insight', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  // Fetch user goals for velocity tracking
  const { data: goals = [] } = useQuery({
    queryKey: ['goals-insight', user?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: user?.id }, '-updated_date', 100),
    enabled: !!user,
    initialData: []
  });

  // Get workouts from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30Days = recentWorkouts.filter(w => new Date(w.created_date) > thirtyDaysAgo);

  // Get last 3 finished workouts
  const last3Workouts = last30Days
    .filter(w => w.status === 'finished')
    .slice(0, 3);

  // Calculate insights
  const insights = [];

  // 1. Check recovery deficit (no recovery in last 3 sessions)
  const hasRecoveryInLast3 = last3Workouts.some(w => {
    if (w.workout_type === 'recovery') return true;
    const chapters = w.session_data?.chapters || [];
    return chapters.some(ch => ch.type === 'recovery');
  });

  if (last3Workouts.length >= 3 && !hasRecoveryInLast3) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Recovery Deficit Detected',
      message: 'No recovery work in your last 3 sessions. Your next session should include a 10-minute mobility flow or stretching to prevent burnout.',
      priority: 'high'
    });
  }

  // 2. Check macro-training alignment (Bulking + High Endurance)
  const nutritionGoal = user?.nutrition_goal_mode || 'maintaining';
  
  // Calculate endurance volume (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7Days = last30Days.filter(w => new Date(w.created_date) > sevenDaysAgo);
  
  let totalEnduranceKm = 0;
  last7Days.forEach(workout => {
    if (workout.workout_type === 'endurance') {
      const chapters = workout.session_data?.chapters || [];
      chapters.forEach(ch => {
        if (ch.type === 'endurance' && ch.data?.distance) {
          totalEnduranceKm += ch.data.distance;
        }
      });
    }
    const chapters = workout.session_data?.chapters || [];
    chapters.forEach(ch => {
      if (ch.type === 'endurance' && ch.data?.distance) {
        totalEnduranceKm += ch.data.distance;
      }
    });
  });

  if (nutritionGoal === 'bulking' && totalEnduranceKm > 10) {
    insights.push({
      type: 'info',
      icon: TrendingUp,
      title: 'High Energy Expenditure',
      message: `You've logged ${totalEnduranceKm.toFixed(1)}km this week while bulking. Consider adding a 400-calorie snack post-workout to protect your muscle-building goal.`,
      priority: 'medium'
    });
  }

  // 3. Check endurance volume during cutting
  if (nutritionGoal === 'cutting' && totalEnduranceKm < 5) {
    insights.push({
      type: 'info',
      icon: Activity,
      title: 'Low Cardio Volume',
      message: `Only ${totalEnduranceKm.toFixed(1)}km this week. Adding 2-3 cardio sessions could accelerate your cutting phase while preserving muscle.`,
      priority: 'low'
    });
  }

  // Sprint 4: Velocity Tracking & Achievement Prediction
  goals.forEach(goal => {
    if (goal.status !== 'active') return;

    // Get goal progress history from recent updates
    const goalWorkouts = last30Days.filter(w => {
      // Match workouts to goal discipline
      if (goal.discipline === 'strength' && (w.workout_type === 'strength' || w.workout_type === 'gym')) return true;
      if (goal.discipline === 'endurance' && w.workout_type === 'endurance') return true;
      if (goal.discipline === 'combat' && w.workout_type === 'martial_arts') return true;
      
      const chapters = w.session_data?.chapters || [];
      return chapters.some(ch => 
        (goal.discipline === 'strength' && ch.type === 'strength') ||
        (goal.discipline === 'endurance' && ch.type === 'endurance') ||
        (goal.discipline === 'combat' && ch.type === 'martial_arts')
      );
    });

    // Calculate velocity (rate of progress)
    if (goalWorkouts.length >= 3) {
      const weeklyProgress = goalWorkouts.length / 4; // Approximate weekly workout rate
      const currentProgress = goal.current_value || 0;
      const remaining = goal.target_value - currentProgress;

      // Sprint 4: Plateau Detection (no improvement in 14 days)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const recentProgressWorkouts = goalWorkouts.filter(w => new Date(w.created_date) > twoWeeksAgo);

      if (recentProgressWorkouts.length === 0 && currentProgress < goal.target_value) {
        insights.push({
          type: 'warning',
          icon: Zap,
          title: 'Plateau Detected',
          message: `No progress on "${goal.title}" in 14+ days. Your body has adapted to the current stimulus. Consider introducing new exercises, adjusting volume, or trying a different training protocol to break through this plateau.`,
          priority: 'high'
        });
      } else if (weeklyProgress > 0 && remaining > 0) {
        // Calculate estimated weeks to goal
        const progressPerWeek = remaining / (remaining / weeklyProgress);
        const weeksToGoal = Math.ceil(remaining / (currentProgress / 4)); // Rough estimate

        if (weeksToGoal > 0 && weeksToGoal < 12) {
          insights.push({
            type: 'success',
            icon: Target,
            title: 'On Track to Goal',
            message: `At your current pace of ${(currentProgress / 4).toFixed(1)} ${goal.metric_unit}/week, you're on track to hit your "${goal.title}" goal of ${goal.target_value}${goal.metric_unit} in approximately ${weeksToGoal} weeks. Keep up the great work!`,
            priority: 'medium'
          });
        }
      }
    }
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Generate Daily Directive
  const generateDirective = () => {
    if (!readinessData) return { text: 'Analyzing your data...', color: 'amber' };
    
    const overall = readinessData.overall;
    const zones = readinessData.zones;
    
    // Find freshest zone
    const zoneNames = { upper_body: 'Upper Body', lower_body: 'Lower Body', cns: 'CNS' };
    const freshestZone = Object.keys(zones).reduce((a, b) => zones[a] > zones[b] ? a : b);
    
    if (overall >= 85) {
      return { 
        text: `Today is a High-Intensity Green Day. Push for PRs.`,
        color: 'green',
        subtext: 'All systems primed for maximum output.'
      };
    } else if (overall >= 60) {
      return { 
        text: `${zoneNames[freshestZone]} is Fresh. Target Controlled Intensity.`,
        color: 'amber',
        subtext: 'Strategic training beats brute force.'
      };
    } else {
      return { 
        text: `Systemic Fatigue Detected. Focus on Technical Flow over Power.`,
        color: 'red',
        subtext: 'Recovery accelerates progress.'
      };
    }
  };

  const directive = generateDirective();
  
  // Mood orb colors
  const orbColors = {
    green: 'bg-gradient-to-br from-green-400 to-emerald-500',
    amber: 'bg-gradient-to-br from-amber-400 to-orange-500',
    red: 'bg-gradient-to-br from-red-400 to-rose-500'
  };

  // Zone status for pills
  const getZoneStatus = (score) => {
    if (score >= 85) return { label: 'Fresh', emoji: '🟢', color: 'green' };
    if (score >= 60) return { label: 'Steady', emoji: '🟡', color: 'amber' };
    return { label: 'Fried', emoji: '🔴', color: 'red' };
  };

  // Generate Coach's Nuggets
  const nuggets = [];
  
  // Nutrition pivot based on combat volume
  const combatWorkouts = last7Days.filter(w => {
    if (w.workout_type === 'martial_arts') return true;
    const chapters = w.session_data?.chapters || [];
    return chapters.some(ch => ch.type === 'martial_arts');
  });
  
  if (combatWorkouts.length >= 3 && user?.nutrition_goal_mode === 'bulking') {
    nuggets.push({
      title: 'The Nutrition Pivot',
      message: `You've burned 800+ extra calories in sparring this week. Increase carbs tonight to protect your muscle-mass goal.`,
      icon: TrendingUp
    });
  }

  // Recovery gap
  if (!hasRecoveryInLast3 && last3Workouts.length >= 3) {
    nuggets.push({
      title: 'The Recovery Gap',
      message: `Your last 3 sessions had 0 recovery rounds. Speed up your return-to-play by adding a 5-min Ice Bath.`,
      icon: AlertCircle
    });
  }

  // Achievement path from goals
  const activeGoal = goals.find(g => g.status === 'active' && g.discipline === 'endurance');
  if (activeGoal && activeGoal.target_date) {
    const daysLeft = differenceInDays(new Date(activeGoal.target_date), new Date());
    if (daysLeft > 0 && daysLeft < 30) {
      nuggets.push({
        title: 'The Achievement Path',
        message: `At your current pace, your ${activeGoal.title} is ${daysLeft} days away. Stick to the current zone-2 volume.`,
        icon: Target
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Daily Directive Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden"
      >
        {/* Glowing Orb */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${orbColors[directive.color]} blur-3xl`}
        />
        
        <div className="relative z-10">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Daily Directive</div>
          <h2 className="text-white text-2xl font-bold leading-tight mb-2">
            {directive.text}
          </h2>
          <p className="text-white/60 text-sm">{directive.subtext}</p>
        </div>
      </motion.div>

      {/* Fatigue Snapshot */}
      {readinessData && (
        <div className="space-y-3">
          <h3 className="text-white/60 text-xs uppercase tracking-widest">Fatigue Snapshot</h3>
          
          {Object.keys(readinessData.zones).map((zone, idx) => {
            const status = getZoneStatus(readinessData.zones[zone]);
            const zoneName = { upper_body: 'Upper Body', lower_body: 'Lower Body', cns: 'CNS' }[zone];
            const recommendations = {
              upper_body: {
                Fresh: 'High-velocity output ready.',
                Steady: 'Controlled pressing acceptable.',
                Fried: 'Avoid heavy pressing.'
              },
              lower_body: {
                Fresh: 'Power movements cleared.',
                Steady: 'Moderate volume only.',
                Fried: 'Skip leg-dominant work.'
              },
              cns: {
                Fresh: 'Sparring & coordination work cleared.',
                Steady: 'Technical drills preferred.',
                Fried: 'Avoid high-intensity combat.'
              }
            };

            return (
              <motion.div
                key={zone}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{status.emoji}</span>
                    <span className="text-white font-semibold text-sm">{zoneName}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    status.color === 'green' ? 'bg-green-500/20 text-green-400' :
                    status.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    Status: {status.label}
                  </div>
                </div>
                <p className="text-white/60 text-xs">
                  {recommendations[zone][status.label]}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Coach's Nuggets */}
      {nuggets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white/60 text-xs uppercase tracking-widest">Coach's Nuggets</h3>
          
          <div className="relative">
            <motion.div
              key={currentCard}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                {React.createElement(nuggets[currentCard].icon, { 
                  className: 'w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5' 
                })}
                <div>
                  <h4 className="text-white font-bold text-sm mb-2">
                    {nuggets[currentCard].title}
                  </h4>
                  <p className="text-white/80 text-xs leading-relaxed">
                    {nuggets[currentCard].message}
                  </p>
                </div>
              </div>
              
              {/* Swipe indicators */}
              {nuggets.length > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {nuggets.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentCard ? 'bg-violet-400 w-4' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentCard((currentCard + 1) % nuggets.length)}
                    className="text-white/40 hover:text-white/60 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* Quick-Pivot Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        <Button
          className="h-16 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-sm flex-col gap-1"
        >
          <Zap className="w-5 h-5" />
          Generate Session
        </Button>
        <Button
          className="h-16 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-sm flex-col gap-1"
        >
          <Flame className="w-5 h-5" />
          Recovery Flow
        </Button>
      </div>
    </div>
  );
}