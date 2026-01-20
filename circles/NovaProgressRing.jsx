import React from 'react';
import { motion } from 'framer-motion';

export default function NovaProgressRing({ 
  current, 
  target, 
  unit, 
  size = 160,
  strokeWidth = 12 
}) {
  const percentage = Math.min((current / target) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isComplete = percentage >= 100;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer Glow Ring */}
      {isComplete && (
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full blur-xl"
          style={{ 
            backgroundColor: 'var(--nova-accent)',
            filter: 'brightness(1.5)'
          }}
        />
      )}

      {/* SVG Progress Ring */}
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--nova-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 ${isComplete ? 15 : 8}px var(--nova-accent))`
          }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          key={current}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center"
        >
          {/* Fraction Display */}
          <div className="flex items-baseline justify-center gap-1 mb-1">
            <motion.span 
              className="text-3xl font-black font-mono"
              style={{ 
                color: 'var(--nova-accent)',
                textShadow: '0 0 15px var(--nova-accent-glow)'
              }}
              animate={isComplete ? { 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 0.5 }}
            >
              {current}
            </motion.span>
            <span className="text-white/40 text-lg font-medium">/</span>
            <span className="text-white/40 text-lg font-medium font-mono">{target}</span>
          </div>

          {/* Unit Label */}
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
            {unit}
          </p>

          {/* Percentage */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs font-bold mt-1"
            style={{ color: 'var(--nova-accent)' }}
          >
            {percentage.toFixed(0)}%
          </motion.div>
        </motion.div>
      </div>

      {/* Completion Pulse */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 1],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-4"
          style={{ 
            borderColor: 'var(--nova-accent)',
            filter: 'brightness(1.5)'
          }}
        />
      )}
    </div>
  );
}