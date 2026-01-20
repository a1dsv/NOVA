import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Award } from 'lucide-react';

export default function PlantDiversityTracker({ weeklyPoints, goal = 30 }) {
  const progress = (weeklyPoints / goal) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-4 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px #10b981)' }} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Plant Diversity</h3>
            <p className="text-white/40 text-xs uppercase tracking-wider">This week</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-emerald-400 neon-data">{weeklyPoints}</div>
          <div className="text-white/40 text-xs font-mono">/ {goal} points</div>
        </div>
      </div>

      <div className="relative h-2.5 bg-black/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
          style={{ filter: 'drop-shadow(0 0 6px #10b981)' }}
        />
      </div>

      {weeklyPoints >= goal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex items-center gap-2 mt-3 text-emerald-400 text-sm"
        >
          <Award className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 6px #10b981)' }} />
          <span className="font-bold">Weekly goal achieved! 🎉</span>
        </motion.div>
      )}

      <p className="text-white/60 text-xs mt-3 leading-relaxed">
        Each unique plant food adds 1 point. Aim for {goal} different plants per week!
      </p>
    </motion.div>
  );
}