import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Timer, Swords, Sparkles } from 'lucide-react';

export default function WorkoutLaunchpad({ onSelect }) {
  const modules = [
    {
      id: 'gym',
      name: 'GYM',
      icon: Dumbbell,
      color: 'from-cyan-500 to-blue-500',
      description: 'Strength & Hypertrophy'
    },
    {
      id: 'run',
      name: 'RUN',
      icon: Timer,
      color: 'from-green-500 to-emerald-500',
      description: 'Endurance & Cardio'
    },
    {
      id: 'combat',
      name: 'COMBAT',
      icon: Swords,
      color: 'from-red-500 to-orange-500',
      description: 'Martial Arts & HIIT'
    },
    {
      id: 'recovery',
      name: 'RECOVERY',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      description: 'Active Recovery'
    }
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-white font-bold text-4xl mb-2">SELECT DISCIPLINE</h1>
          <p className="text-white/40 text-sm">Choose your training mode</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {modules.map((module, idx) => {
            const Icon = module.icon;
            return (
              <motion.button
                key={module.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(module.id)}
                className="relative overflow-hidden rounded-3xl aspect-square"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color}`} />
                <div className="relative h-full flex flex-col items-center justify-center p-6 text-white">
                  <Icon className="w-16 h-16 mb-4" strokeWidth={1.5} />
                  <h3 className="font-bold text-2xl mb-1">{module.name}</h3>
                  <p className="text-xs opacity-80">{module.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}