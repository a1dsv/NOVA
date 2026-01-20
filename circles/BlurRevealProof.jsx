import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Trophy, Sparkles } from 'lucide-react';

export default function BlurRevealProof({ 
  photoUrl, 
  postId, 
  requiredTaps = 3,
  unveilers = [],
  currentUserId,
  onTapToUnveil
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showShatter, setShowShatter] = useState(false);
  const tapsRemaining = Math.max(0, requiredTaps - unveilers.length);
  const canReveal = tapsRemaining === 0;

  useEffect(() => {
    if (canReveal && !isRevealed) {
      setShowShatter(true);
      setTimeout(() => {
        setIsRevealed(true);
        setShowShatter(false);
      }, 600);
    }
  }, [canReveal, isRevealed]);

  const handleTap = () => {
    if (!isRevealed && !unveilers.includes(currentUserId)) {
      onTapToUnveil?.(postId, currentUserId);
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
      {/* The Actual Photo */}
      <img
        src={photoUrl}
        alt="Quest proof"
        className={`w-full h-full object-cover transition-all duration-1000 ${
          !isRevealed ? 'blur-2xl scale-105' : 'blur-0 scale-100'
        }`}
      />

      {/* Glass Shatter Effect */}
      <AnimatePresence>
        {showShatter && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0
                }}
                animate={{
                  opacity: 0,
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  rotate: Math.random() * 360,
                  scale: Math.random() * 0.5
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 bg-white/20 backdrop-blur-xl border-2 border-white/30"
                style={{
                  clipPath: `polygon(
                    ${Math.random() * 100}% ${Math.random() * 100}%,
                    ${Math.random() * 100}% ${Math.random() * 100}%,
                    ${Math.random() * 100}% ${Math.random() * 100}%
                  )`
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Overlay UI */}
      {!isRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 flex flex-col items-center justify-center"
        >
          {/* Tap to Unveil Button */}
          <motion.button
            onClick={handleTap}
            whileTap={{ scale: 0.95 }}
            disabled={unveilers.includes(currentUserId)}
            className="px-6 py-3 rounded-full backdrop-blur-xl border-2 flex items-center gap-3 group transition-all"
            style={{
              backgroundColor: unveilers.includes(currentUserId) 
                ? 'rgba(255,255,255,0.1)' 
                : `rgba(var(--nova-accent-rgb), 0.2)`,
              borderColor: unveilers.includes(currentUserId) 
                ? 'rgba(255,255,255,0.3)' 
                : 'var(--nova-accent)',
              boxShadow: unveilers.includes(currentUserId) 
                ? 'none' 
                : '0 0 20px var(--nova-accent-glow)'
            }}
          >
            {unveilers.includes(currentUserId) ? (
              <>
                <Sparkles className="w-5 h-5 text-white/60" />
                <span className="text-white/60 font-bold text-sm">You Tapped!</span>
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'var(--nova-accent)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--nova-accent)' }}>
                  Tap to Unveil
                </span>
              </>
            )}
          </motion.button>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex items-center gap-2"
          >
            <div className="flex gap-1">
              {[...Array(requiredTaps)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i < unveilers.length 
                      ? 'var(--nova-accent)' 
                      : 'rgba(255,255,255,0.2)',
                    boxShadow: i < unveilers.length 
                      ? '0 0 10px var(--nova-accent-glow)' 
                      : 'none'
                  }}
                />
              ))}
            </div>
            <span className="text-white/60 text-xs font-medium">
              {tapsRemaining > 0 
                ? `${tapsRemaining} more ${tapsRemaining === 1 ? 'tap' : 'taps'} needed`
                : 'Revealing...'
              }
            </span>
          </motion.div>

          {/* Achievement Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2"
            style={{
              backgroundColor: `rgba(var(--nova-accent-rgb), 0.2)`,
              borderColor: 'var(--nova-accent)',
              boxShadow: '0 0 15px var(--nova-accent-glow)'
            }}
          >
            <Trophy className="w-4 h-4" style={{ color: 'var(--nova-accent)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--nova-accent)' }}>
              MILESTONE
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* Revealed Celebration */}
      {isRevealed && (
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute top-4 left-4 px-3 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2"
          style={{
            backgroundColor: `rgba(var(--nova-accent-rgb), 0.2)`,
            borderColor: 'var(--nova-accent)',
            boxShadow: '0 0 15px var(--nova-accent-glow)'
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: 'var(--nova-accent)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--nova-accent)' }}>
            REVEALED
          </span>
        </motion.div>
      )}
    </div>
  );
}