import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function MetricGauge({ value, onChange, unit, max, min = 0 }) {
  const [isDragging, setIsDragging] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Visual Display */}
      <div className="text-center mb-6">
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-5xl font-black font-mono mb-2"
          style={{ 
            color: 'var(--nova-accent)',
            textShadow: '0 0 30px var(--nova-accent-glow)'
          }}
        >
          {value.toFixed(1)}
        </motion.div>
        <p className="text-white/60 text-sm font-medium uppercase tracking-wider">
          {unit}
        </p>
      </div>

      {/* Gauge Slider */}
      <div className="relative">
        {/* Track Background */}
        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
          {/* Progress Fill */}
          <motion.div
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="h-full rounded-full relative"
            style={{
              background: `linear-gradient(90deg, var(--nova-accent), rgba(var(--nova-accent-rgb), 0.6))`,
              boxShadow: '0 0 15px var(--nova-accent-glow)'
            }}
          >
            {/* Animated Shimmer */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </div>
          </motion.div>
        </div>

        {/* Interactive Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={0.1}
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />

        {/* Min/Max Labels */}
        <div className="flex justify-between mt-2 text-xs text-white/40 font-mono">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Percentage Display */}
      <div className="text-center">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/60 text-xs font-medium"
        >
          {percentage.toFixed(0)}% Complete
        </motion.div>
      </div>
    </div>
  );
}