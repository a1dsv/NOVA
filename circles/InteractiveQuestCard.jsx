import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Zap, TrendingUp, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function InteractiveQuestCard({ quest, post, onHype, currentUserId, onRevealProof }) {
  const percentage = quest.target_value ? Math.min(100, (quest.current_value / quest.target_value) * 100) : 0;
  const isComplete = percentage >= 100;
  const isNearComplete = percentage >= 75 && percentage < 100;
  
  // Calculate progress change if available
  const progressDelta = post?.current_value && post?.previous_value 
    ? post.current_value - post.previous_value 
    : 0;
  const showLevelUp = progressDelta > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border bg-white/[0.02] backdrop-blur-xl p-5"
      style={{
        borderColor: isComplete ? 'var(--nova-accent)' : 'rgba(255,255,255,0.1)',
        boxShadow: isComplete ? '0 0 30px var(--nova-accent-glow)' : 'none'
      }}
    >
      {/* Glow Background Effect */}
      {(isComplete || isNearComplete) && (
        <div 
          className="absolute inset-0 blur-3xl opacity-20"
          style={{ backgroundColor: 'var(--nova-accent)' }}
        />
      )}

      {/* Dynamic Header */}
      <div className="relative z-10 flex items-center gap-3 mb-4">
        <motion.div
          animate={isComplete ? { 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          } : {}}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative"
          style={{
            border: `2px solid var(--nova-accent)`,
            boxShadow: '0 0 15px var(--nova-accent-glow)'
          }}
        >
          {isComplete ? (
            <Trophy className="w-6 h-6" style={{ color: 'var(--nova-accent)' }} />
          ) : (
            <Target className="w-6 h-6" style={{ color: 'var(--nova-accent)' }} />
          )}
          
          {/* Level Up Badge */}
          {showLevelUp && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--nova-accent)' }}
            >
              <TrendingUp className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </motion.div>

        <div className="flex-1">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            {post?.user_name || quest.user_name} 
            {isComplete && (
              <span className="text-xs" style={{ color: 'var(--nova-accent)' }}>
                ✨ Achieved!
              </span>
            )}
          </h3>
          <p className="text-white/40 text-xs line-clamp-1">
            {quest.goal_title || quest.title}
          </p>
        </div>

        {showLevelUp && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ 
              backgroundColor: `rgba(var(--nova-accent-rgb), 0.2)`,
              color: 'var(--nova-accent)'
            }}
          >
            +{progressDelta} {quest.metric_unit}
          </motion.div>
        )}
      </div>

      {/* Progress Ring with Social Energy */}
      <div className="relative z-10 flex justify-center py-6">
        <div 
          className="absolute inset-0 blur-3xl rounded-full opacity-30"
          style={{ backgroundColor: 'var(--nova-accent)' }}
        />
        <div className="relative">
          {/* Circular Progress */}
          <svg width="140" height="140" className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="var(--nova-accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 60}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 60 * (1 - percentage / 100)
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                filter: `drop-shadow(0 0 8px var(--nova-accent))`
              }}
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-2xl font-black text-white font-mono"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {quest.current_value || post?.current_value || 0}
            </motion.span>
            <span className="text-white/40 text-xs font-medium">
              / {quest.target_value || post?.target_value || 0} {quest.metric_unit}
            </span>
            <motion.span 
              className="text-xs font-bold mt-1"
              style={{ color: 'var(--nova-accent)' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {Math.round(percentage)}%
            </motion.span>
          </div>
        </div>
      </div>

      {/* Deadline Info */}
      {quest.deadline && (
        <div className="relative z-10 flex items-center justify-center gap-2 mb-4 text-white/40 text-xs">
          <Calendar className="w-3 h-3" />
          <span>Due {format(new Date(quest.deadline), 'MMM d, yyyy')}</span>
        </div>
      )}

      {/* Social Interaction Bar */}
      <div className="relative z-10 flex gap-2 border-t border-white/5 pt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onHype?.('fire', post?.id || quest.id)}
          className="flex-1 bg-white/[0.05] hover:bg-white/10 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group border border-white/10"
        >
          <Flame className="w-4 h-4 group-hover:scale-125 transition-transform" style={{ color: 'var(--nova-accent)' }} />
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 group-hover:text-white">
            Hype
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onHype?.('nudge', post?.id || quest.id)}
          className="flex-1 bg-white/[0.05] hover:bg-cyan-500/20 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group border border-white/10"
        >
          <Zap className="w-4 h-4 group-hover:animate-bounce" style={{ color: 'cyan' }} />
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 group-hover:text-cyan-400">
            Nudge
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}