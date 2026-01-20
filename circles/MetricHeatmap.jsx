import React from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from 'date-fns';
import { Check } from 'lucide-react';

export default function MetricHeatmap({ completedDays = [], onToggleDay, month, year }) {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const today = new Date();
  const streakCount = completedDays.length;
  const targetDays = days.length;
  const percentage = (streakCount / targetDays) * 100;

  const isDayComplete = (day) => {
    return completedDays.some(d => isSameDay(new Date(d), day));
  };

  const canToggle = (day) => {
    // Can only toggle today or past days
    return day <= today;
  };

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black font-mono mb-2"
          style={{ 
            color: 'var(--nova-accent)',
            textShadow: '0 0 30px var(--nova-accent-glow)'
          }}
        >
          {streakCount}
        </motion.div>
        <p className="text-white/60 text-sm font-medium uppercase tracking-wider">
          Days Complete
        </p>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/40 text-xs mt-1"
        >
          {percentage.toFixed(0)}% of {targetDays} days
        </motion.div>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-white/40 text-xs font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const isComplete = isDayComplete(day);
            const isToday = isSameDay(day, today);
            const canClick = canToggle(day);

            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileTap={canClick ? { scale: 0.9 } : {}}
                onClick={() => canClick && onToggleDay?.(day)}
                disabled={!canClick}
                className="aspect-square rounded-xl backdrop-blur-xl border flex items-center justify-center relative overflow-hidden transition-all"
                style={{
                  backgroundColor: isComplete 
                    ? `rgba(var(--nova-accent-rgb), 0.2)` 
                    : 'rgba(255,255,255,0.03)',
                  borderColor: isToday 
                    ? 'var(--nova-accent)' 
                    : isComplete 
                      ? 'var(--nova-accent)' 
                      : 'rgba(255,255,255,0.1)',
                  boxShadow: isComplete ? '0 0 15px var(--nova-accent-glow)' : 'none',
                  opacity: !canClick ? 0.3 : 1,
                  cursor: canClick ? 'pointer' : 'not-allowed'
                }}
              >
                {/* Shimmer Effect on Complete */}
                {isComplete && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                )}

                {/* Check Icon */}
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <Check className="w-4 h-4" style={{ color: 'var(--nova-accent)' }} />
                  </motion.div>
                )}

                {/* Day Number */}
                {!isComplete && (
                  <span className="text-xs font-medium text-white/60">
                    {format(day, 'd')}
                  </span>
                )}

                {/* Today Ring */}
                {isToday && !isComplete && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: 'var(--nova-accent)' }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Streak Indicator */}
      {streakCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-3 rounded-xl backdrop-blur-xl border"
          style={{
            backgroundColor: `rgba(var(--nova-accent-rgb), 0.1)`,
            borderColor: 'var(--nova-accent)'
          }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--nova-accent)' }}>
            🔥 {streakCount} Day Streak
          </p>
        </motion.div>
      )}
    </div>
  );
}