import React from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, TrendingUp, Dumbbell, Activity, Brain } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateReadiness, getReadinessStatus } from '@/components/performanceEngine';

export default function ReadinessGauge({ user }) {
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-readiness', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
    initialData: []
  });

  const readinessData = calculateReadiness(workouts);
  const overallStatus = getReadinessStatus(readinessData.overall);

  const zones = [
    {
      id: 'upper_body',
      label: 'Upper Body',
      icon: Dumbbell,
      score: readinessData.zones.upper_body,
      color: getReadinessStatus(readinessData.zones.upper_body).color
    },
    {
      id: 'lower_body',
      label: 'Lower Body',
      icon: Activity,
      score: readinessData.zones.lower_body,
      color: getReadinessStatus(readinessData.zones.lower_body).color
    },
    {
      id: 'cns',
      label: 'CNS/Systemic',
      icon: Brain,
      score: readinessData.zones.cns,
      color: getReadinessStatus(readinessData.zones.cns).color
    }
  ];

  const colorMap = {
    green: {
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/40',
      text: 'text-green-400',
      bar: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    amber: {
      bg: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-500'
    },
    red: {
      bg: 'from-red-500/20 to-rose-500/20',
      border: 'border-red-500/40',
      text: 'text-red-400',
      bar: 'bg-gradient-to-r from-red-500 to-rose-500'
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Readiness */}
      <div className={`bg-gradient-to-br ${colorMap[overallStatus.color].bg} border ${colorMap[overallStatus.color].border} rounded-2xl p-5`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
            <Zap className={`w-7 h-7 ${colorMap[overallStatus.color].text}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Overall Readiness</h3>
            <p className="text-white/60 text-sm">Zone-specific recovery status</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${colorMap[overallStatus.color].text}`}>
              {readinessData.overall}%
            </div>
            <div className={`text-xs font-semibold ${colorMap[overallStatus.color].text}`}>
              {overallStatus.label}
            </div>
          </div>
        </div>
      </div>

      {/* Zone Breakdown */}
      <div className="space-y-3">
        <h4 className="text-white/60 text-sm font-semibold">Zone Readiness</h4>
        {zones.map(zone => {
          const Icon = zone.icon;
          const colors = colorMap[zone.color];
          const status = getReadinessStatus(zone.score);

          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold">{zone.label}</div>
                  <div className={`text-xs font-medium ${colors.text}`}>{status.label}</div>
                </div>
                <div className={`text-xl font-bold ${colors.text}`}>
                  {Math.round(zone.score)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${zone.score}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full ${colors.bar}`}
                />
              </div>

              {/* Recovery Boost Indicator */}
              {readinessData.recovery_boosts[zone.id] > 1 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{readinessData.recovery_boosts[zone.id].toFixed(1)}x recovery active</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recommendations */}
      {readinessData.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white/60 text-sm font-semibold">AI Recommendations</h4>
          {readinessData.recommendations.map((rec, idx) => {
            const isFresh = rec.type === 'fresh_zone';
            const colors = isFresh ? colorMap.green : colorMap.amber;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0`}>
                    {isFresh ? (
                      <Zap className={`w-4 h-4 ${colors.text}`} />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
                    )}
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">{rec.message}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}