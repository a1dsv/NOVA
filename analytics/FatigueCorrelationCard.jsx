import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateReadiness } from '@/components/performanceEngine';
import { TrendingUp, Zap, Activity, Dumbbell } from 'lucide-react';

export default function FatigueCorrelationCard({ user }) {
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-correlation', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  const calculateCorrelations = () => {
    const correlations = [];

    // Boxing intensity vs readiness
    const boxingWorkouts = workouts.filter(w => 
      w.workout_type === 'martial_arts' && 
      w.session_type?.toLowerCase().includes('box')
    );

    if (boxingWorkouts.length >= 5) {
      const highReadinessBoxing = [];
      const lowReadinessBoxing = [];

      boxingWorkouts.forEach(workout => {
        const workoutsBeforeSession = workouts.filter(w => 
          new Date(w.created_date) < new Date(workout.created_date)
        );
        const readiness = calculateReadiness(workoutsBeforeSession);

        const rounds = workout.session_data?.chapters?.[0]?.data?.total_rounds || 
                      workout.session_data?.total_rounds || 0;

        if (readiness.overall >= 80) {
          highReadinessBoxing.push(rounds);
        } else if (readiness.overall < 60) {
          lowReadinessBoxing.push(rounds);
        }
      });

      if (highReadinessBoxing.length > 0 && lowReadinessBoxing.length > 0) {
        const avgHigh = highReadinessBoxing.reduce((a, b) => a + b, 0) / highReadinessBoxing.length;
        const avgLow = lowReadinessBoxing.reduce((a, b) => a + b, 0) / lowReadinessBoxing.length;
        const improvement = Math.round(((avgHigh - avgLow) / avgLow) * 100);

        if (improvement > 0) {
          correlations.push({
            type: 'boxing',
            icon: Zap,
            color: 'cyan',
            metric: 'rounds completed',
            improvement,
            message: `Your Boxing volume is ${improvement}% higher when Systemic Readiness is above 80%`
          });
        }
      }
    }

    // Strength volume vs readiness
    const strengthWorkouts = workouts.filter(w => w.workout_type === 'strength');
    
    if (strengthWorkouts.length >= 5) {
      const highReadinessStrength = [];
      const lowReadinessStrength = [];

      strengthWorkouts.forEach(workout => {
        const workoutsBeforeSession = workouts.filter(w => 
          new Date(w.created_date) < new Date(workout.created_date)
        );
        const readiness = calculateReadiness(workoutsBeforeSession);

        const volume = workout.total_volume || 0;

        if (volume > 0) {
          if (readiness.overall >= 80) {
            highReadinessStrength.push(volume);
          } else if (readiness.overall < 60) {
            lowReadinessStrength.push(volume);
          }
        }
      });

      if (highReadinessStrength.length > 0 && lowReadinessStrength.length > 0) {
        const avgHigh = highReadinessStrength.reduce((a, b) => a + b, 0) / highReadinessStrength.length;
        const avgLow = lowReadinessStrength.reduce((a, b) => a + b, 0) / lowReadinessStrength.length;
        const improvement = Math.round(((avgHigh - avgLow) / avgLow) * 100);

        if (improvement > 0) {
          correlations.push({
            type: 'strength',
            icon: Dumbbell,
            color: 'violet',
            metric: 'total volume',
            improvement,
            message: `Your Strength volume is ${improvement}% higher when Overall Readiness is above 80%`
          });
        }
      }
    }

    // Endurance pace vs readiness
    const runWorkouts = workouts.filter(w => w.workout_type === 'endurance');
    
    if (runWorkouts.length >= 5) {
      const highReadinessRuns = [];
      const lowReadinessRuns = [];

      runWorkouts.forEach(workout => {
        const workoutsBeforeSession = workouts.filter(w => 
          new Date(w.created_date) < new Date(workout.created_date)
        );
        const readiness = calculateReadiness(workoutsBeforeSession);

        const distance = workout.session_data?.chapters?.[0]?.data?.distance || 0;
        const duration = workout.duration_minutes || 0;

        if (distance > 0 && duration > 0) {
          const pace = duration / distance; // min per km

          if (readiness.zones.lower_body >= 80) {
            highReadinessRuns.push(pace);
          } else if (readiness.zones.lower_body < 60) {
            lowReadinessRuns.push(pace);
          }
        }
      });

      if (highReadinessRuns.length > 0 && lowReadinessRuns.length > 0) {
        const avgHigh = highReadinessRuns.reduce((a, b) => a + b, 0) / highReadinessRuns.length;
        const avgLow = lowReadinessRuns.reduce((a, b) => a + b, 0) / lowReadinessRuns.length;
        const improvement = Math.round(((avgLow - avgHigh) / avgLow) * 100); // Lower pace is better

        if (improvement > 0) {
          correlations.push({
            type: 'endurance',
            icon: Activity,
            color: 'green',
            metric: 'pace',
            improvement,
            message: `Your Running pace is ${improvement}% faster when Lower Body Readiness is above 80%`
          });
        }
      }
    }

    return correlations;
  };

  const correlations = calculateCorrelations();

  const colorMap = {
    cyan: {
      bg: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20'
    },
    violet: {
      bg: 'from-violet-500/20 to-purple-500/20',
      border: 'border-violet-500/30',
      text: 'text-violet-400',
      iconBg: 'bg-violet-500/20'
    },
    green: {
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      iconBg: 'bg-green-500/20'
    }
  };

  if (correlations.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-bold text-lg mb-2">Fatigue Correlation</h3>
        <p className="text-white/60 text-sm">
          Keep training to unlock insights about how readiness affects your performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">Performance Correlations</h3>
      <p className="text-white/60 text-sm mb-4">
        How readiness impacts your workout quality
      </p>

      {correlations.map((corr, idx) => {
        const Icon = corr.icon;
        const colors = colorMap[corr.color];

        return (
          <div
            key={idx}
            className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-5`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl ${colors.iconBg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-7 h-7 ${colors.text}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`w-5 h-5 ${colors.text}`} />
                  <span className={`text-2xl font-bold ${colors.text}`}>+{corr.improvement}%</span>
                </div>
                <p className="text-white/90 leading-relaxed">{corr.message}</p>
                <p className="text-white/40 text-xs mt-2">
                  Based on {workouts.filter(w => w.workout_type === corr.type).length} {corr.type} sessions
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}