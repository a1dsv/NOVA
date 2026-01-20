import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-xl">
        <p className="text-white/60 text-xs mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-cyan-400 font-bold font-mono text-lg neon-data">{payload[0].value.toLocaleString()} lbs</p>
      </div>
    );
  }
  return null;
};

export default function VolumeProgressChart({ workouts }) {
  const [selectedRange, setSelectedRange] = useState('30d');
  
  const filterByRange = (workouts, range) => {
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, 'all': 365 * 10 };
    const days = daysMap[range];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return workouts.filter(w => new Date(w.created_date) >= cutoff);
  };
  
  const filteredWorkouts = filterByRange(workouts.filter(w => w.total_volume), selectedRange);
  
  const data = filteredWorkouts
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map(w => ({
      date: format(new Date(w.created_date), 'MMM d'),
      volume: w.total_volume || 0,
      fullDate: w.created_date
    }));
  
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No volume data available
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map((range) => (
            <motion.button
              key={range}
              onClick={() => setSelectedRange(range)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedRange === range
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              {range === 'all' ? 'All' : range.toUpperCase()}
            </motion.button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00F2FF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00F2FF" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
          <Area 
            type="monotone" 
            dataKey="volume" 
            stroke="#00F2FF" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#volumeGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Max Volume</p>
          <p className="text-cyan-400 font-bold">{Math.max(...data.map(d => d.volume)).toLocaleString()}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Avg Volume</p>
          <p className="text-white font-bold">{Math.round(data.reduce((sum, d) => sum + d.volume, 0) / data.length).toLocaleString()}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Sessions</p>
          <p className="text-violet-400 font-bold">{data.length}</p>
        </div>
      </div>
    </motion.div>
  );
}