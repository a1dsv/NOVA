import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dumbbell, Activity, Swords, Heart, TrendingUp } from 'lucide-react';

export default function BenchmarkLevels({ user }) {
  const { data: workouts = [] } = useQuery({
    queryKey: ['benchmark-workouts', user?.id],
    queryFn: async () => {
      const all = await base44.entities.Workout.filter({ user_id: user.id }, '-created_date', 100);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return all.filter(w => new Date(w.created_date) > thirtyDaysAgo && w.status === 'finished');
    },
    enabled: !!user
  });

  if (!user) {
    return null;
  }

  const tiers = [
    { name: 'Novice', color: 'slate', min: 0, max: 25 },
    { name: 'Intermediate', color: 'blue', min: 25, max: 50 },
    { name: 'Advanced', color: 'violet', min: 50, max: 75 },
    { name: 'Elite', color: 'amber', min: 75, max: 100 }
  ];

  const getTierColor = (score) => {
    if (score >= 75) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', fill: 'bg-amber-500' };
    if (score >= 50) return { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', fill: 'bg-violet-500' };
    if (score >= 25) return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', fill: 'bg-blue-500' };
    return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', fill: 'bg-slate-500' };
  };

  const getTierName = (score) => {
    if (score >= 75) return 'Elite';
    if (score >= 50) return 'Advanced';
    if (score >= 25) return 'Intermediate';
    return 'Novice';
  };

  // Calculate Strength Level (based on max weight lifted relative to bodyweight)
  const calculateStrengthLevel = () => {
    const userWeight = user?.bodyweight || 70; // Default 70kg if not set
    const strengthWorkouts = workouts.filter(w => w.workout_type === 'gym');
    
    if (strengthWorkouts.length === 0) return { score: 0, detail: 'No strength sessions logged' };

    let maxBenchPress = 0;
    let maxSquat = 0;
    let maxDeadlift = 0;

    strengthWorkouts.forEach(workout => {
      if (workout.exercises) {
        workout.exercises.forEach(ex => {
          const maxWeight = Math.max(...(ex.set_records?.map(s => s.weight || 0) || [0]));
          const exName = ex.name.toLowerCase();
          
          if (exName.includes('bench')) maxBenchPress = Math.max(maxBenchPress, maxWeight);
          if (exName.includes('squat')) maxSquat = Math.max(maxSquat, maxWeight);
          if (exName.includes('deadlift')) maxDeadlift = Math.max(maxDeadlift, maxWeight);
        });
      }
    });

    // Average multiplier across all lifts
    const benchMultiplier = maxBenchPress / userWeight;
    const squatMultiplier = maxSquat / userWeight;
    const deadliftMultiplier = maxDeadlift / userWeight;
    
    const avgMultiplier = (benchMultiplier + squatMultiplier + deadliftMultiplier) / 3;

    // Score: 0.5x = 0%, 1.0x = 25%, 1.5x = 50%, 2.0x = 75%, 2.5x+ = 100%
    const score = Math.min(Math.round((avgMultiplier / 2.5) * 100), 100);
    
    return { 
      score, 
      detail: `${avgMultiplier.toFixed(2)}x bodyweight avg` 
    };
  };

  // Calculate Endurance Level (based on 5km pace)
  const calculateEnduranceLevel = () => {
    const enduranceWorkouts = workouts.filter(w => w.workout_type === 'run');
    
    if (enduranceWorkouts.length === 0) return { score: 0, detail: 'No runs logged' };

    // Find runs with distance >= 5km
    const longRuns = enduranceWorkouts.filter(w => {
      if (!w.exercises || !w.exercises[0]) return false;
      const totalDistance = w.exercises[0].set_records?.reduce((sum, s) => sum + (s.distance_km || 0), 0) || 0;
      return totalDistance >= 4.5; // Allow 4.5km+ as "5km runs"
    });

    if (longRuns.length === 0) return { score: 15, detail: 'No 5km+ runs yet' };

    // Calculate best pace (min/km)
    let bestPace = 999;
    longRuns.forEach(run => {
      if (run.exercises && run.exercises[0]) {
        const totalDistance = run.exercises[0].set_records?.reduce((sum, s) => sum + (s.distance_km || 0), 0) || 0;
        const totalTime = run.duration_minutes || 0;
        
        if (totalDistance > 0 && totalTime > 0) {
          const pace = totalTime / totalDistance; // min/km
          bestPace = Math.min(bestPace, pace);
        }
      }
    });

    // Score: >7 min/km = 0%, 6 min/km = 25%, 5 min/km = 50%, 4 min/km = 75%, 3 min/km = 100%
    let score = 0;
    if (bestPace <= 3) score = 100;
    else if (bestPace <= 4) score = 75;
    else if (bestPace <= 5) score = 50;
    else if (bestPace <= 6) score = 25;
    else if (bestPace <= 7) score = 15;

    return { 
      score, 
      detail: `Best: ${bestPace.toFixed(1)} min/km` 
    };
  };

  // Calculate Combat Level (rounds per week consistency)
  const calculateCombatLevel = () => {
    const combatWorkouts = workouts.filter(w => w.workout_type === 'martial_arts');
    
    if (combatWorkouts.length === 0) return { score: 0, detail: 'No combat sessions logged' };

    // Calculate total rounds across all workouts
    const totalRounds = combatWorkouts.reduce((sum, w) => {
      if (w.session_data && w.session_data.rounds) {
        return sum + w.session_data.rounds;
      }
      return sum + 5; // Default 5 rounds if not specified
    }, 0);

    // Rounds per week (last 30 days)
    const roundsPerWeek = (totalRounds / 30) * 7;

    // Score: 1-5 = 0-25%, 6-10 = 25-50%, 11-15 = 50-75%, 16+ = 75-100%
    let score = 0;
    if (roundsPerWeek >= 16) score = 100;
    else if (roundsPerWeek >= 11) score = 50 + ((roundsPerWeek - 11) / 5) * 25;
    else if (roundsPerWeek >= 6) score = 25 + ((roundsPerWeek - 6) / 5) * 25;
    else score = (roundsPerWeek / 6) * 25;

    return { 
      score: Math.min(Math.round(score), 100), 
      detail: `${Math.round(roundsPerWeek)} rounds/week` 
    };
  };

  // Calculate Recovery Level (sessions per week)
  const calculateRecoveryLevel = () => {
    const recoveryWorkouts = workouts.filter(w => w.workout_type === 'recovery');
    
    if (recoveryWorkouts.length === 0) return { score: 0, detail: 'No recovery sessions logged' };

    // Sessions per week (last 30 days)
    const sessionsPerWeek = (recoveryWorkouts.length / 30) * 7;

    // Score: 0-1 = 0-25%, 2-3 = 25-50%, 4-5 = 50-75%, 6+ = 75-100%
    let score = 0;
    if (sessionsPerWeek >= 6) score = 100;
    else if (sessionsPerWeek >= 4) score = 50 + ((sessionsPerWeek - 4) / 2) * 25;
    else if (sessionsPerWeek >= 2) score = 25 + ((sessionsPerWeek - 2) / 2) * 25;
    else score = (sessionsPerWeek / 2) * 25;

    return { 
      score: Math.min(Math.round(score), 100), 
      detail: `${sessionsPerWeek.toFixed(1)} sessions/week` 
    };
  };

  const disciplines = [
    { 
      id: 'strength', 
      name: 'Power', 
      icon: Dumbbell, 
      data: calculateStrengthLevel() 
    },
    { 
      id: 'endurance', 
      name: 'Stamina', 
      icon: Activity, 
      data: calculateEnduranceLevel() 
    },
    { 
      id: 'combat', 
      name: 'Technique', 
      icon: Swords, 
      data: calculateCombatLevel() 
    },
    { 
      id: 'recovery', 
      name: 'Longevity', 
      icon: Heart, 
      data: calculateRecoveryLevel() 
    }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg mb-1">Athletic Benchmarks</h3>
          <p className="text-white/40 text-xs uppercase tracking-wider">Your current tier in each discipline</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
        </div>
      </div>

      <div className="space-y-4">
        {disciplines.map((disc, idx) => {
          const Icon = disc.icon;
          const colors = getTierColor(disc.data.score);
          const tierName = getTierName(disc.data.score);
          const progressInTier = (disc.data.score % 25) * 4; // Progress within current tier (0-100%)

          return (
            <motion.div
              key={disc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
              whileTap={{ scale: 0.98 }}
              className={`${colors.bg} backdrop-blur-xl border ${colors.border} rounded-xl p-4 cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{disc.name}</div>
                    <div className="text-white/40 text-xs font-mono">{disc.data.detail}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                  <span className={`text-xs font-bold ${colors.text}`}>{tierName}</span>
                </div>
              </div>

              {/* Level Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white/60 uppercase tracking-wider">Level Progress</span>
                  <span className={`${colors.text} font-mono font-bold`}>{disc.data.score}/100</span>
                </div>
                <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${disc.data.score}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: idx * 0.1 }}
                    className={`h-full ${colors.fill} rounded-full relative`}
                    style={{ filter: `drop-shadow(0 0 6px currentColor)` }}
                  >
                    {/* Pulse effect at the end of progress bar */}
                    {disc.data.score > 0 && (
                      <div className={`absolute right-0 top-0 bottom-0 w-1 ${colors.fill} opacity-50 animate-pulse`} />
                    )}
                  </motion.div>
                </div>

                {/* Tier milestones */}
                <div className="flex justify-between mt-1">
                  {tiers.map(tier => (
                    <div key={tier.name} className="text-[10px] text-white/30">
                      {tier.name}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
        className="mt-4 bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-3"
      >
        <div className="text-cyan-400 text-xs font-bold mb-1 uppercase tracking-wider">How Tiers Work</div>
        <ul className="text-white/60 text-xs space-y-1 leading-relaxed">
          <li>• <span className="text-white/80 font-semibold">Power:</span> Based on bodyweight multipliers for lifts</li>
          <li>• <span className="text-white/80 font-semibold">Stamina:</span> Based on your best 5km pace</li>
          <li>• <span className="text-white/80 font-semibold">Technique:</span> Based on combat rounds per week</li>
          <li>• <span className="text-white/80 font-semibold">Longevity:</span> Based on recovery sessions per week</li>
        </ul>
      </motion.div>
    </div>
  );
}