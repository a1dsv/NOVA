import React from 'react';
import { motion } from 'framer-motion';
import { Timer, Target, Swords, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProtocolSelector({ onSelect, onBack }) {
  const protocols = [
    {
      id: 'endurance',
      name: 'Endurance',
      icon: Timer,
      color: 'from-green-500 to-emerald-500',
      description: 'GPS tracking + pace monitoring'
    },
    {
      id: 'rounds',
      name: 'Rounds Timer',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      description: 'Interval training with rest periods'
    },
    {
      id: 'combat',
      name: 'Combat Drills',
      icon: Swords,
      color: 'from-purple-500 to-pink-500',
      description: 'Round timer with drill cues'
    },
    {
      id: 'strength',
      name: 'Strength',
      icon: Dumbbell,
      color: 'from-cyan-500 to-blue-500',
      description: 'Traditional set-based tracking'
    }
  ];

  return (
    <div className="space-y-3">
      {onBack && (
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-white/60 hover:text-white mb-2"
        >
          ← Back
        </Button>
      )}
      
      <h3 className="text-white font-semibold text-lg mb-4">Select Training Protocol</h3>
      
      {protocols.map((protocol, idx) => {
        const Icon = protocol.icon;
        return (
          <motion.button
            key={protocol.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(protocol.id)}
            className="w-full text-left"
          >
            <div className="relative overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-all group">
              <div className={`absolute inset-0 bg-gradient-to-r ${protocol.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="relative p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${protocol.color} flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">{protocol.name}</h4>
                  <p className="text-white/50 text-sm">{protocol.description}</p>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}