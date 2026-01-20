import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = {
  gym: '#00F2FF',
  run: '#FF006E',
  calisthenics: '#8F00FF',
  martial_arts: '#FFB800'
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  
  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#fff" className="text-sm font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#fff" className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {payload.value}
      </text>
      <text x={cx} y={cy} dy={38} textAnchor="middle" fill="rgba(255,255,255,0.5)" className="text-xs font-mono">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function WorkoutDistributionChart({ workouts }) {
  const [activeIndex, setActiveIndex] = useState(null);
  
  const data = [
    { name: 'Gym', value: workouts.filter(w => w.workout_type === 'gym').length, type: 'gym' },
    { name: 'Running', value: workouts.filter(w => w.workout_type === 'run').length, type: 'run' },
    { name: 'Calisthenics', value: workouts.filter(w => w.workout_type === 'calisthenics').length, type: 'calisthenics' },
    { name: 'Martial Arts', value: workouts.filter(w => w.workout_type === 'martial_arts').length, type: 'martial_arts' },
  ].filter(item => item.value > 0);
  
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No workout data available
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]"
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.type]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        {data.map((item, idx) => (
          <motion.button
            key={item.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={() => setActiveIndex(data.indexOf(item))}
            onMouseLeave={() => setActiveIndex(null)}
            className="flex items-center gap-2 p-3 rounded-lg bg-black/30 hover:bg-white/5 transition-colors"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: COLORS[item.type],
                boxShadow: `0 0 8px ${COLORS[item.type]}`
              }}
            />
            <div className="flex-1 text-left">
              <p className="text-white/60 text-xs uppercase tracking-wider">{item.name}</p>
              <p className="text-white font-bold font-mono">{item.value}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}