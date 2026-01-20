import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Minus, Calendar, Trophy, Edit2, Trash2, Dumbbell, Activity, Swords, Leaf, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const disciplineIcons = {
  strength: Dumbbell,
  endurance: Activity,
  combat: Swords,
  nutrition: Leaf
};

export default function GoalProgressCard({ goal, onEdit, onDelete }) {
  const progress = ((goal.current_value || 0) / (goal.target_value || 1)) * 100;
  const progressClamped = Math.max(0, Math.min(100, progress));
  const isCompleted = goal.status === 'completed';
  const daysLeft = goal.target_date ? differenceInDays(new Date(goal.target_date), new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  const DisciplineIcon = disciplineIcons[goal.discipline] || Target;

  // Fetch goal history (progress updates over time)
  const { data: goalHistory = [] } = useQuery({
    queryKey: ['goal-history', goal.id],
    queryFn: async () => {
      // Fetch all goals with the same title to track progress over time
      const allGoals = await base44.entities.Goal.filter({ user_id: goal.user_id }, '-updated_date', 50);
      const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
      return allGoals
        .filter(g => g.id === goal.id || g.title === goal.title)
        .filter(g => new Date(g.updated_date) > fourWeeksAgo)
        .sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date));
    },
    enabled: !!goal.user_id
  });

  // Calculate velocity (progress per week)
  const calculateVelocity = () => {
    if (goalHistory.length < 2) return 0;
    
    const firstRecord = goalHistory[0];
    const lastRecord = goalHistory[goalHistory.length - 1];
    
    const valueChange = (lastRecord.current_value || 0) - (firstRecord.current_value || 0);
    const timeChange = (new Date(lastRecord.updated_date) - new Date(firstRecord.updated_date)) / (1000 * 60 * 60 * 24 * 7); // weeks
    
    return timeChange > 0 ? valueChange / timeChange : 0;
  };

  // Calculate estimated achievement date
  const calculateEstimatedDate = () => {
    const velocity = calculateVelocity();
    if (velocity <= 0 || isCompleted) return null;
    
    const remaining = goal.target_value - (goal.current_value || 0);
    const weeksToGoal = remaining / velocity;
    const daysToGoal = Math.round(weeksToGoal * 7);
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToGoal);
    
    return estimatedDate;
  };

  // Calculate trend (last 3 updates)
  const calculateTrend = () => {
    if (goalHistory.length < 3) return 'stable';
    
    const recent = goalHistory.slice(-3);
    const changes = [];
    
    for (let i = 1; i < recent.length; i++) {
      const change = (recent[i].current_value || 0) - (recent[i - 1].current_value || 0);
      changes.push(change);
    }
    
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    if (avgChange > 0.5) return 'up';
    if (avgChange < -0.5) return 'down';
    return 'stable';
  };

  // Check for stagnation (no progress in 14 days)
  const checkStagnation = () => {
    if (!goal.updated_date) return false;
    
    const daysSinceUpdate = differenceInDays(new Date(), new Date(goal.updated_date));
    
    // Check if current value hasn't changed in 14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentUpdates = goalHistory.filter(g => new Date(g.updated_date) > twoWeeksAgo);
    
    if (recentUpdates.length === 0) return true;
    
    const hasProgress = recentUpdates.some(g => g.current_value !== goal.current_value);
    return !hasProgress;
  };

  const velocity = calculateVelocity();
  const estimatedDate = calculateEstimatedDate();
  const trend = calculateTrend();
  const isStagnant = checkStagnation();

  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    down: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    stable: { icon: Minus, color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' }
  };

  const TrendIcon = trendConfig[trend].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileTap={{ scale: 0.98 }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-5 shadow-[inset_0_0_15px_rgba(139,92,246,0.08)] ${
        isCompleted 
          ? 'border-emerald-500/30' 
          : isOverdue 
            ? 'border-red-500/30' 
            : 'border-white/10'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCompleted ? 'nova-gradient' : 'bg-white/5'
          }`}>
            <DisciplineIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">{goal.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                {goal.discipline}
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
              {daysLeft !== null && !isCompleted && (
                <Badge className={`text-xs ${
                  isOverdue 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : daysLeft < 7
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-white/10 text-white/60 border-white/20'
                }`}>
                  <Calendar className="w-3 h-3 mr-1" />
                  {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            onClick={() => onEdit(goal)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            <Edit2 className="w-4 h-4 text-white/60" />
          </motion.button>
          <motion.button
            onClick={() => onDelete(goal.id)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 text-white/60 hover:text-red-400" />
          </motion.button>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Current</p>
          <p className="text-cyan-400 font-bold font-mono text-lg neon-data">{goal.current_value || 0} {goal.metric_unit || ''}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Target</p>
          <p className="text-violet-400 font-bold font-mono text-lg neon-data">{goal.target_value} {goal.metric_unit || ''}</p>
        </div>
      </div>

      {/* Velocity & Trend */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {velocity > 0 && (
            <div className="bg-black/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-white/40" />
                <p className="text-white/40 text-xs uppercase tracking-wider">Velocity</p>
              </div>
              <p className="text-emerald-400 font-bold font-mono text-sm neon-data">
                +{velocity.toFixed(1)} {goal.metric_unit}/wk
              </p>
            </div>
          )}
          <div className={`rounded-lg p-3 ${trendConfig[trend].bg} border ${trendConfig[trend].border}`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendIcon className={`w-3 h-3 ${trendConfig[trend].color}`} />
              <p className="text-white/40 text-xs">Trend</p>
            </div>
            <p className={`font-semibold text-sm capitalize ${trendConfig[trend].color}`}>
              {trend}
            </p>
          </div>
        </div>
      )}

      {/* Estimated Achievement Date */}
      {estimatedDate && !isCompleted && (
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-violet-400" />
            <p className="text-violet-400 text-xs font-semibold">Estimated Achievement</p>
          </div>
          <p className="text-white font-bold">{format(estimatedDate, 'MMM dd, yyyy')}</p>
          <p className="text-white/60 text-xs mt-1">
            ~{Math.round(differenceInDays(estimatedDate, new Date()) / 7)} weeks at current pace
          </p>
        </div>
      )}

      {/* Stagnation Alert */}
      {isStagnant && !isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-lg p-3 mb-4"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-400 text-xs font-semibold mb-1">Progress Plateau Detected</p>
              <p className="text-white/60 text-xs">
                No progress on "{goal.title}" for 14+ days. Consider a de-load week or increasing recovery rounds.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60 text-xs uppercase tracking-wider">Progress</span>
          <span className="text-white font-bold font-mono">{progressClamped.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressClamped}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`h-full rounded-full ${
              isCompleted 
                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                : 'bg-gradient-to-r from-cyan-500 to-violet-500'
            }`}
            style={{ 
              filter: isCompleted 
                ? 'drop-shadow(0 0 6px #10b981)'
                : 'drop-shadow(0 0 6px #06b6d4)'
            }}
          />
        </div>
      </div>

      {/* Notes */}
      {goal.notes && (
        <p className="text-white/60 text-sm mt-4 italic">{goal.notes}</p>
      )}
    </motion.div>
  );
}