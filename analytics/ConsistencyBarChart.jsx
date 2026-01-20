import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/60 backdrop-blur-xl border border-violet-500/30 rounded-xl p-3 shadow-xl">
        <p className="text-white/60 text-xs mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-violet-400 font-bold font-mono text-lg neon-data">{payload[0].value} workouts</p>
      </div>
    );
  }
  return null;
};

export default function ConsistencyBarChart({ workouts }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  
  const getWeeklyData = () => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.created_date);
        return workoutDate >= weekStart && workoutDate < weekEnd;
      });
      
      weeks.push({
        week: i === 0 ? 'Now' : `${i}w`,
        count: weekWorkouts.length,
        isThisWeek: i === 0
      });
    }
    return weeks;
  };
  
  const data = getWeeklyData();
  const maxCount = Math.max(...data.map(d => d.count));
  const avgCount = data.reduce((sum, d) => sum + d.count, 0) / data.length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="week" 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[8, 8, 0, 0]}
            onMouseEnter={(data, index) => setHoveredBar(index)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={
                  hoveredBar === index 
                    ? '#00F2FF'
                    : entry.isThisWeek 
                      ? '#8F00FF' 
                      : entry.count >= avgCount
                        ? 'rgba(143, 0, 255, 0.6)'
                        : 'rgba(255, 255, 255, 0.2)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Peak Week</p>
          <p className="text-cyan-400 font-bold font-mono neon-data">{maxCount}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Weekly Avg</p>
          <p className="text-white font-bold font-mono">{avgCount.toFixed(1)}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">This Week</p>
          <p className="text-violet-400 font-bold font-mono neon-data">{data[data.length - 1].count}</p>
        </div>
      </div>
    </motion.div>
  );
}