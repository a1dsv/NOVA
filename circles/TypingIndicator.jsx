import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const displayText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typingUsers.join(',')}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="px-4 py-2"
      >
        <div className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 w-fit">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: 'var(--nova-accent)',
                  boxShadow: '0 0 10px var(--nova-accent-glow)'
                }}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 1, 0.4],
                  y: [0, -3, 0]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          <motion.span 
            className="text-white/60 text-xs font-medium"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {displayText}
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}