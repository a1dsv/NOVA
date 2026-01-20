import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

export default function ProgressTracker({ participation, challenge }) {
  const progressPercent = Math.min(100, (participation.current_progress / challenge.target_value) * 100);
  
  // Prepare chart data
  const chartData = participation.progress_history?.map(entry => ({
    date: format(new Date(entry.date), 'MMM d'),
    value: entry.value
  })) || [];

  return (
    <div className="space-y-4">
      {/* Progress Circle */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Your Progress</h3>
          <Award className="w-5 h-5 text-amber-400" />
        </div>

        <div className="flex items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 352" }}
                animate={{ strokeDasharray: `${(progressPercent / 100) * 352} 352` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8F00FF" />
                  <stop offset="100%" stopColor="#00F2FF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{progressPercent.toFixed(0)}%</span>
              <span className="text-xs text-white/40">Complete</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-white/40 text-xs mb-1">Current</p>
            <p className="text-white font-bold">{participation.current_progress}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-white/40 text-xs mb-1">Target</p>
            <p className="text-white font-bold">{challenge.target_value}</p>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Progress Over Time</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                stroke="#666" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#666" 
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#1a1a1a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#00F2FF" 
                strokeWidth={2}
                dot={{ fill: '#00F2FF', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-center">
          <Calendar className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{chartData.length}</p>
          <p className="text-white/40 text-xs">Days Active</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{participation.points || 0}</p>
          <p className="text-white/40 text-xs">Points</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-center">
          <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{participation.badges_earned?.length || 0}</p>
          <p className="text-white/40 text-xs">Badges</p>
        </div>
      </div>
    </div>
  );
}