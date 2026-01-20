import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, X } from 'lucide-react';

export default function PinnedMessageBanner({ pinnedMessages, onUnpin, onJumpTo }) {
  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const latestPinned = pinnedMessages[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-shimmer backdrop-blur-lg border-b border-white/10 px-4 py-2 flex items-center gap-3 relative"
        style={{ backgroundColor: `rgba(var(--nova-accent-rgb), 0.1)` }}
      >
        <Pin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nova-accent)' }} />
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onJumpTo?.(latestPinned)}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--nova-accent)' }}>{latestPinned.sender_name}</p>
          <p className="text-white/80 text-sm truncate">{latestPinned.content}</p>
        </div>
        {pinnedMessages.length > 1 && (
          <span className="text-white/60 text-xs">+{pinnedMessages.length - 1}</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnpin(latestPinned);
          }}
          className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center flex-shrink-0"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}