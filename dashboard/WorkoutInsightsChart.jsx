import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-cyan-500/30 rounded-xl p-3 shadow-xl">
        <p className="text-white font-bold mb-2">{payload[0].payload.exercise}</p>
        <p className="text-cyan-400 text-sm">Total Sets: {payload[0].value}</p>
        <p className="text-violet-400 text-sm">Completed: {payload[1]?.value || 0}</p>
      </div>
    );
  }
  return null;
};

export default function WorkoutInsightsChart({ activeSession }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  
  if (!activeSession || !activeSession.exercises || activeSession.exercises.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No active session data
      </div>
    );
  }
  
  const data = activeSession.exercises.map(ex => {
    const totalSets = ex.set_records?.length || 0;
    const completedSets = ex.set_records?.filter(s => s.completed).length || 0;
    return {
      exercise: ex.name.length > 15 ? ex.name.substring(0, 15) + '...' : ex.name,
      fullName: ex.name,
      total: totalSets,
      completed: completedSets,
      remaining: totalSets - completedSets
    };
  });
  
  const totalSets = data.reduce((sum, d) => sum + d.total, 0);
  const completedSets = data.reduce((sum, d) => sum + d.completed, 0);
  const completionRate = totalSets > 0 ? ((completedSets / totalSets) * 100).toFixed(0) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="exercise" 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }} />
          <Bar 
            dataKey="completed" 
            stackId="a" 
            fill="#00F2FF" 
            radius={[0, 0, 4, 4]}
            name="Completed"
          />
          <Bar 
            dataKey="remaining" 
            stackId="a" 
            fill="rgba(255,255,255,0.1)" 
            radius={[4, 4, 0, 0]}
            name="Remaining"
          />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Total Sets</p>
          <p className="text-white font-bold">{totalSets}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Completed</p>
          <p className="text-cyan-400 font-bold">{completedSets}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Progress</p>
          <p className="text-green-400 font-bold">{completionRate}%</p>
        </div>
      </div>
    </motion.div>
  );
}