import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export default function MetricStepper({ value, onChange, unit, max, min = 0, step = 1 }) {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max || Infinity);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-4">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-14 h-14 rounded-full backdrop-blur-xl border-2 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          backgroundColor: `rgba(var(--nova-accent-rgb), 0.1)`,
          borderColor: 'var(--nova-accent)',
          boxShadow: value > min ? '0 0 20px var(--nova-accent-glow)' : 'none'
        }}
      >
        <Minus className="w-6 h-6 text-white" />
      </motion.button>

      <div className="flex-1 text-center">
        <motion.div
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-4xl font-black font-mono"
          style={{ 
            color: 'var(--nova-accent)',
            textShadow: '0 0 20px var(--nova-accent-glow)'
          }}
        >
          {value}
        </motion.div>
        <p className="text-white/60 text-sm font-medium mt-1 uppercase tracking-wider">
          {unit}
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleIncrement}
        disabled={max && value >= max}
        className="w-14 h-14 rounded-full backdrop-blur-xl border-2 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          backgroundColor: `rgba(var(--nova-accent-rgb), 0.1)`,
          borderColor: 'var(--nova-accent)',
          boxShadow: (!max || value < max) ? '0 0 20px var(--nova-accent-glow)' : 'none'
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}