import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Moon } from 'lucide-react';

export default function SignalMarker({ signal, onClick, isSelected }) {
  const isSyndicate = signal.type === 'syndicate';
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center justify-center"
    >
      {/* Outer pulse ring */}
      <div 
        className={`absolute w-12 h-12 rounded-full pulse-animation ${
          isSyndicate ? 'bg-cyan-400/30' : 'bg-amber-400/30'
        }`}
      />
      
      {/* Second pulse ring - delayed */}
      <div 
        className={`absolute w-12 h-12 rounded-full pulse-animation ${
          isSyndicate ? 'bg-cyan-400/20' : 'bg-amber-400/20'
        }`}
        style={{ animationDelay: '0.5s' }}
      />
      
      {/* Core marker */}
      <div 
        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
          isSyndicate 
            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600' 
            : 'bg-gradient-to-br from-amber-400 to-amber-600'
        } ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
        style={{
          boxShadow: isSyndicate 
            ? '0 0 20px rgba(0, 242, 255, 0.5)' 
            : '0 0 20px rgba(251, 191, 36, 0.5)'
        }}
      >
        {isSyndicate ? (
          <Zap className="w-5 h-5 text-black" />
        ) : (
          <Moon className="w-5 h-5 text-black" />
        )}
      </div>
    </motion.button>
  );
}