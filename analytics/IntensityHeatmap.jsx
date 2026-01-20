import React from 'react';
import { motion } from 'framer-motion';

export default function IntensityHeatmap({ workouts }) {
  const getLast90Days = () => {
    const days = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.created_date);
        return workoutDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date: date.toISOString().split('T')[0],
        count: dayWorkouts.length,
        intensity: dayWorkouts.length === 0 ? 0 : Math.min(dayWorkouts.length * 25, 100)
      });
    }
    return days;
  };
  
  const days = getLast90Days();
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  const monthLabels = ['3 months ago', '2 months ago', '1 month ago', 'This month'];
  
  const getColor = (intensity) => {
    if (intensity === 0) return 'rgba(255,255,255,0.05)';
    if (intensity <= 25) return 'rgba(143,0,255,0.3)';
    if (intensity <= 50) return 'rgba(143,0,255,0.5)';
    if (intensity <= 75) return 'rgba(0,242,255,0.5)';
    return 'rgba(0,242,255,0.8)';
  };
  
  const totalWorkouts = days.reduce((sum, d) => sum + d.count, 0);
  const activeDays = days.filter(d => d.count > 0).length;
  const currentStreak = (() => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) streak++;
      else break;
    }
    return streak;
  })();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1 min-w-full">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex gap-1">
              {week.map((day, dayIdx) => (
                <motion.div
                  key={day.date}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIdx * 7 + dayIdx) * 0.01 }}
                  className="group relative"
                >
                  <div
                    className="w-3 h-3 rounded-sm transition-transform hover:scale-150 cursor-pointer"
                    style={{ backgroundColor: getColor(day.intensity) }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                      <p className="text-white font-semibold">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-white/60">
                        {day.count} {day.count === 1 ? 'workout' : 'workouts'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-white/40">Less</span>
        <div className="flex gap-1">
          {[0, 25, 50, 75, 100].map((intensity) => (
            <div 
              key={intensity}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getColor(intensity) }}
            />
          ))}
        </div>
        <span className="text-white/40">More</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Total Days</p>
          <p className="text-cyan-400 font-bold">{totalWorkouts}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Active Days</p>
          <p className="text-green-400 font-bold">{activeDays}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Streak</p>
          <p className="text-amber-400 font-bold">{currentStreak} 🔥</p>
        </div>
      </div>
    </motion.div>
  );
}