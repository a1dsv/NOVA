import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-3 shadow-xl">
        <p className="text-white/60 text-xs mb-2">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="font-bold text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value} min
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DurationTrendChart({ workouts }) {
  const last30Workouts = workouts
    .filter(w => w.duration_minutes)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-30);
  
  const data = last30Workouts.map((w, idx) => ({
    session: `#${idx + 1}`,
    duration: w.duration_minutes,
    date: format(new Date(w.created_date), 'MMM d'),
    type: w.workout_type
  }));
  
  // Calculate moving average
  const windowSize = 5;
  const movingAvg = data.map((_, idx, arr) => {
    if (idx < windowSize - 1) return null;
    const window = arr.slice(idx - windowSize + 1, idx + 1);
    const avg = window.reduce((sum, d) => sum + d.duration, 0) / windowSize;
    return Math.round(avg);
  });
  
  const chartData = data.map((d, idx) => ({
    ...d,
    movingAvg: movingAvg[idx]
  }));
  
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No duration data available
      </div>
    );
  }
  
  const avgDuration = Math.round(data.reduce((sum, d) => sum + d.duration, 0) / data.length);
  const maxDuration = Math.max(...data.map(d => d.duration));
  const minDuration = Math.min(...data.map(d => d.duration));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}
          />
          <Line 
            type="monotone" 
            dataKey="duration" 
            stroke="#FFB800" 
            strokeWidth={2}
            dot={{ fill: '#FFB800', r: 4 }}
            name="Duration"
          />
          <Line 
            type="monotone" 
            dataKey="movingAvg" 
            stroke="#FF006E" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="5-Session Avg"
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Average</p>
          <p className="text-amber-400 font-bold">{avgDuration} min</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Longest</p>
          <p className="text-green-400 font-bold">{maxDuration} min</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Shortest</p>
          <p className="text-red-400 font-bold">{minDuration} min</p>
        </div>
      </div>
    </motion.div>
  );
}