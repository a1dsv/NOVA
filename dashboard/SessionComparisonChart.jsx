import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-violet-500/30 rounded-xl p-3 shadow-xl">
        <p className="text-white/60 text-xs mb-2">{payload[0].payload.date}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="font-bold text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SessionComparisonChart({ workouts }) {
  const last10Workouts = workouts
    .filter(w => w.status === 'finished' && w.exercises && w.exercises.length > 0)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-10);
  
  const data = last10Workouts.map((w, idx) => {
    const totalSets = w.exercises?.reduce((sum, ex) => sum + (ex.set_records?.length || 0), 0) || 0;
    const completedSets = w.exercises?.reduce((sum, ex) => sum + (ex.set_records?.filter(s => s.completed).length || 0), 0) || 0;
    
    return {
      session: `#${idx + 1}`,
      date: format(new Date(w.created_date), 'MMM d'),
      exercises: w.exercises?.length || 0,
      totalSets: totalSets,
      completedSets: completedSets,
      duration: w.duration_minutes || 0
    };
  });
  
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        Complete at least one workout to see comparisons
      </div>
    );
  }
  
  const avgExercises = Math.round(data.reduce((sum, d) => sum + d.exercises, 0) / data.length);
  const avgSets = Math.round(data.reduce((sum, d) => sum + d.completedSets, 0) / data.length);
  const avgDuration = Math.round(data.reduce((sum, d) => sum + d.duration, 0) / data.length);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }} />
          <Line 
            type="monotone" 
            dataKey="exercises" 
            stroke="#8F00FF" 
            strokeWidth={2}
            dot={{ fill: '#8F00FF', r: 4 }}
            name="Exercises"
          />
          <Line 
            type="monotone" 
            dataKey="completedSets" 
            stroke="#00F2FF" 
            strokeWidth={2}
            dot={{ fill: '#00F2FF', r: 4 }}
            name="Sets"
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Avg Exercises</p>
          <p className="text-violet-400 font-bold">{avgExercises}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Avg Sets</p>
          <p className="text-cyan-400 font-bold">{avgSets}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Avg Time</p>
          <p className="text-amber-400 font-bold">{avgDuration}m</p>
        </div>
      </div>
    </motion.div>
  );
}