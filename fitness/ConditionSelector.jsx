import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Battery, AlertTriangle } from 'lucide-react';

const conditions = [
  {
    key: 'fresh',
    label: 'Fresh',
    icon: Zap,
    color: 'green',
    description: 'Well rested, ready to push hard',
    multiplier: 1.0
  },
  {
    key: 'tired',
    label: 'Tired',
    icon: Battery,
    color: 'amber',
    description: 'Some fatigue, but can perform',
    multiplier: 1.0
  },
  {
    key: 'compromised',
    label: 'Compromised',
    icon: AlertTriangle,
    color: 'red',
    description: 'Injured or very fatigued',
    multiplier: 1.2
  }
];

export default function ConditionSelector({ value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="text-white font-bold text-lg">How are you feeling?</h3>
        <p className="text-white/40 text-sm mt-1">This affects your group momentum reward</p>
      </div>

      <div className="grid gap-3">
        {conditions.map((condition) => {
          const Icon = condition.icon;
          const isSelected = value === condition.key;

          return (
            <motion.button
              key={condition.key}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(condition.key)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? `bg-${condition.color}-500/20 border-${condition.color}-500`
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-${condition.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${condition.color}-400`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{condition.label}</span>
                    {condition.multiplier > 1.0 && (
                      <span className="text-amber-400 text-xs font-bold">
                        {condition.multiplier}x Momentum
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">{condition.description}</p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  layoutId="condition-selector"
                  className={`absolute inset-0 rounded-xl bg-${condition.color}-500/10 border-2 border-${condition.color}-500`}
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}