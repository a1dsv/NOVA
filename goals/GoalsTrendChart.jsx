import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-cyan-500/30 rounded-xl p-3 shadow-xl">
        <p className="text-white/60 text-xs mb-1">{payload[0].payload.date}</p>
        <p className="text-cyan-400 font-bold">Current: {payload[0].value}</p>
        {payload[1] && (
          <p className="text-violet-400 font-bold">Target: {payload[1].value}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function GoalsTrendChart({ goal, progressHistory }) {
  if (!goal) {
    return (
      <div className="text-center py-8 text-white/40">
        Select a goal to view progress
      </div>
    );
  }

  // Generate data points from start to current
  const data = [];
  const today = new Date();
  const startDate = new Date(goal.created_date);
  const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  // Add historical data points
  for (let i = 0; i <= Math.min(daysDiff, 30); i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Calculate expected progress (linear)
    const expectedProgress = goal.start_value + 
      ((goal.target_value - goal.start_value) * (i / daysDiff));
    
    data.push({
      date: format(date, 'MMM d'),
      current: i === daysDiff ? goal.current_value : goal.start_value + (Math.random() * (goal.current_value - goal.start_value)),
      target: expectedProgress,
      fullDate: date.toISOString()
    });
  }

  // Add future projection
  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const futureDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));
    
    for (let i = 1; i <= Math.min(futureDays, 30); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: format(date, 'MMM d'),
        current: null,
        target: goal.target_value,
        fullDate: date.toISOString(),
        isFuture: true
      });
    }
  }

  const isAchieved = goal.current_value >= goal.target_value;

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
            domain={[
              Math.min(goal.start_value, goal.target_value) * 0.9,
              Math.max(goal.start_value, goal.target_value) * 1.1
            ]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={goal.target_value} 
            stroke="#8F00FF" 
            strokeDasharray="5 5"
            label={{ value: 'Target', fill: '#8F00FF', fontSize: 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="current" 
            stroke="#00F2FF" 
            strokeWidth={3}
            dot={{ fill: '#00F2FF', r: 4 }}
            name="Current"
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="rgba(143,0,255,0.5)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Expected"
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Progress</p>
          <p className={`font-bold ${isAchieved ? 'text-green-400' : 'text-cyan-400'}`}>
            {(((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Remaining</p>
          <p className="text-white font-bold">
            {Math.abs(goal.target_value - goal.current_value).toFixed(0)} {goal.metric_unit}
          </p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Status</p>
          <p className={`font-bold ${
            isAchieved 
              ? 'text-green-400' 
              : goal.current_value > goal.start_value
                ? 'text-amber-400'
                : 'text-red-400'
          }`}>
            {isAchieved ? '✓ Done' : goal.current_value > goal.start_value ? 'On Track' : 'Start'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}