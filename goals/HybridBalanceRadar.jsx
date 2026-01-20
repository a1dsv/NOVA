import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function HybridBalanceRadar({ user }) {
  // Fetch recent workouts (last 30 days)
  const { data: workouts = [] } = useQuery({
    queryKey: ['balance-workouts', user?.id],
    queryFn: async () => {
      const all = await base44.entities.Workout.filter({ user_id: user.id }, '-created_date', 200);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return all.filter(w => new Date(w.created_date) > thirtyDaysAgo && w.status === 'finished');
    },
    enabled: !!user
  });

  if (!user) {
    return null;
  }

  const calculateBalance = () => {
    const strengthWorkouts = workouts.filter(w => w.workout_type === 'gym' || w.workout_type === 'strength');
    const enduranceWorkouts = workouts.filter(w => w.workout_type === 'run' || w.workout_type === 'endurance');
    const combatWorkouts = workouts.filter(w => w.workout_type === 'martial_arts');
    const recoveryWorkouts = workouts.filter(w => w.workout_type === 'recovery');

    const total = workouts.length || 1;

    return {
      power: Math.round((strengthWorkouts.length / total) * 100),
      stamina: Math.round((enduranceWorkouts.length / total) * 100),
      technique: Math.round((combatWorkouts.length / total) * 100),
      longevity: Math.round((recoveryWorkouts.length / total) * 100)
    };
  };

  const getIdealBalance = () => {
    const isBulking = user?.selected_presets?.includes('bulking');
    const isCutting = user?.selected_presets?.includes('cutting');

    if (isBulking) {
      // Bulking: Prioritize Power, reduce Stamina
      return {
        power: 45,
        stamina: 20,
        technique: 20,
        longevity: 15
      };
    } else if (isCutting) {
      // Cutting: Prioritize Stamina & Recovery, reduce Power
      return {
        power: 25,
        stamina: 35,
        technique: 20,
        longevity: 20
      };
    } else {
      // Balanced
      return {
        power: 30,
        stamina: 30,
        technique: 20,
        longevity: 20
      };
    }
  };

  const current = calculateBalance();
  const ideal = getIdealBalance();

  const data = [
    { discipline: 'Power', current: current.power, ideal: ideal.power },
    { discipline: 'Stamina', current: current.stamina, ideal: ideal.stamina },
    { discipline: 'Technique', current: current.technique, ideal: ideal.technique },
    { discipline: 'Longevity', current: current.longevity, ideal: ideal.longevity }
  ];

  // Gap Analysis: Find critical deficits
  const gaps = [
    { name: 'Power', diff: current.power - ideal.power, current: current.power },
    { name: 'Stamina', diff: current.stamina - ideal.stamina, current: current.stamina },
    { name: 'Technique', diff: current.technique - ideal.technique, current: current.technique },
    { name: 'Longevity', diff: current.longevity - ideal.longevity, current: current.longevity }
  ];

  const criticalGaps = gaps.filter(g => g.diff < -15 || (g.current === 0 && ideal[g.name.toLowerCase()] > 0));

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]">
      <div className="mb-4">
        <h3 className="text-white font-bold text-lg mb-1">Hybrid Balance</h3>
        <p className="text-white/40 text-xs uppercase tracking-wider">Last 30 days training distribution</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="#ffffff15" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="discipline" 
            tick={{ fill: '#ffffff80', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: '#ffffff40', fontSize: 10 }}
          />
          <Radar 
            name="Ideal" 
            dataKey="ideal" 
            stroke="#8b5cf6" 
            fill="#8b5cf6" 
            fillOpacity={0.15}
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#000' }}
          />
          <Radar 
            name="Current" 
            dataKey="current" 
            stroke="#06b6d4" 
            fill="#06b6d4" 
            fillOpacity={0.25}
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#06b6d4', strokeWidth: 2, stroke: '#000' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs font-semibold uppercase">Critical Focus Needed</span>
          </div>
          {criticalGaps.map((gap, idx) => (
            <motion.div 
              key={gap.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
              whileTap={{ scale: 0.98 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-red-400 font-semibold text-sm">{gap.name}</div>
                  <div className="text-white/60 text-xs">
                    {gap.current === 0 ? 'No sessions logged' : `${Math.abs(gap.diff)}% below target`}
                  </div>
                </div>
                <div className="text-red-400 text-xl font-bold font-mono">
                  {gap.current}%
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Strategy Info */}
      {(user?.selected_presets?.includes('bulking') || user?.selected_presets?.includes('cutting')) && (
        <div className="mt-4 bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
          <div className="text-violet-400 text-xs font-semibold mb-1">
            {user.selected_presets.includes('bulking') ? '💪 Bulking Strategy' : '🔥 Cutting Strategy'}
          </div>
          <div className="text-white/60 text-xs">
            {user.selected_presets.includes('bulking') 
              ? 'Ideal balance prioritizes Power for muscle growth.'
              : 'Ideal balance prioritizes Stamina & Recovery for joint protection.'}
          </div>
        </div>
      )}
    </div>
  );
}