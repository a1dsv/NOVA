import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Activity, Swords, Heart } from 'lucide-react';
import PreFlightWindow from './PreFlightWindow';
import { base44 } from '@/api/base44Client';

export default function WorkoutSelector({ onStart }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);
  const [selectedType, setSelectedType] = useState(null);

  const workoutTypes = [
    { 
      id: 'martial_arts', 
      name: 'Combat', 
      icon: Swords, 
      colorHex: '#FF003C', // Neon Crimson
      colorRgba: '255, 0, 60',
      color: 'from-red-500 to-orange-500'
    },
    { 
      id: 'strength', 
      name: 'Strength', 
      icon: Dumbbell, 
      colorHex: '#00D2FF', // Electric Blue
      colorRgba: '0, 210, 255',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'endurance', 
      name: 'Endurance', 
      icon: Activity, 
      colorHex: '#BC00FF', // Neon Violet
      colorRgba: '188, 0, 255',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'recovery', 
      name: 'Recovery', 
      icon: Heart, 
      colorHex: '#00FF85', // Neon Emerald
      colorRgba: '0, 255, 133',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {workoutTypes.map((type) => {
            const Icon = type.icon;

            return (
              <motion.button
                key={type.id}
                onClick={() => setSelectedType(type)}
                whileTap={{ 
                  scale: 0.92,
                  boxShadow: `0 0 40px rgba(${type.colorRgba}, 0.8), inset 0 0 20px rgba(${type.colorRgba}, 0.5)`
                }}
                whileHover={{ scale: 1.02 }}
                style={{
                  border: `1.5px solid ${type.colorHex}`,
                  boxShadow: `0 0 20px rgba(${type.colorRgba}, 0.5), inset 0 0 10px rgba(${type.colorRgba}, 0.3)`,
                  '--neon-color': type.colorHex,
                  '--neon-rgba': type.colorRgba
                }}
                className="neon-button relative overflow-hidden rounded-2xl p-8 aspect-square bg-white/5 backdrop-blur-xl transition-all flex flex-col items-center justify-center gap-4"
              >
                <motion.div
                  animate={{}}
                  whileTap={{
                    filter: `drop-shadow(0 0 25px ${type.colorHex}) brightness(1.8)`
                  }}
                >
                  <Icon 
                    className="neon-icon w-12 h-12 transition-all"
                    style={{
                      color: type.colorHex,
                      filter: `drop-shadow(0 0 12px ${type.colorHex})`,
                      stroke: type.colorHex,
                      fill: type.colorHex
                    }}
                  />
                </motion.div>
                <h3 className="text-white font-semibold text-base text-center">{type.name}</h3>
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedType && (
        <PreFlightWindow
          workoutType={selectedType}
          user={user}
          onStart={onStart}
          onClose={() => setSelectedType(null)}
        />
      )}
    </>
  );
}