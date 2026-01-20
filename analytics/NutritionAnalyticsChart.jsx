import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  
  return (
    <div className="bg-zinc-900 border border-white/20 rounded-lg p-3">
      <p className="text-white/60 text-xs mb-2">{payload[0].payload.date}</p>
      <div className="space-y-1">
        <p className="text-cyan-400 text-sm">Calories: {payload[0].value}</p>
        <p className="text-violet-400 text-sm">Protein: {payload[0].payload.protein}g</p>
        <p className="text-amber-400 text-sm">Carbs: {payload[0].payload.carbs}g</p>
        <p className="text-green-400 text-sm">Fat: {payload[0].payload.fat}g</p>
      </div>
    </div>
  );
};

export default function NutritionAnalyticsChart({ meals }) {
  const [days, setDays] = useState(7);

  // Process data
  const chartData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayMeals = meals.filter(m => m.meal_date === dateStr);
    
    chartData.push({
      date: format(date, 'MMM d'),
      calories: dayMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0),
      protein: dayMeals.reduce((sum, m) => sum + (m.total_protein || 0), 0),
      carbs: dayMeals.reduce((sum, m) => sum + (m.total_carbs || 0), 0),
      fat: dayMeals.reduce((sum, m) => sum + (m.total_fat || 0), 0)
    });
  }

  const avgCalories = chartData.reduce((sum, d) => sum + d.calories, 0) / days;

  return (
    <div>
      {/* Time Range Selector */}
      <div className="flex gap-2 mb-4">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              days === d
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00F2FF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00F2FF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="#ffffff20"
            style={{ fontSize: '11px', fill: '#ffffff60' }}
          />
          <YAxis 
            stroke="#ffffff20"
            style={{ fontSize: '11px', fill: '#ffffff60' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="calories" 
            stroke="#00F2FF" 
            fill="url(#calorieGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Avg Calories</p>
          <p className="text-cyan-400 font-bold">{avgCalories.toFixed(0)}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Days Tracked</p>
          <p className="text-violet-400 font-bold">{chartData.filter(d => d.calories > 0).length}</p>
        </div>
      </div>
    </div>
  );
}