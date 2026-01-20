import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Leaf, Pizza, Trophy } from 'lucide-react';

const ratings = [
  { value: 1, label: 'Cheat Meal', icon: Pizza, color: '#EF4444' },
  { value: 2, label: 'Off Day', icon: Pizza, color: '#F97316' },
  { value: 3, label: 'Solid', icon: Leaf, color: '#F59E0B' },
  { value: 4, label: 'Clean', icon: Leaf, color: '#84CC16' },
  { value: 5, label: 'Elite Fuel', icon: Trophy, color: '#10B981' }
];

export default function NutritionRatingSlider({ 
  postId, 
  currentRating,
  userRatings = {},
  currentUserId,
  onRate 
}) {
  const [hoverValue, setHoverValue] = useState(null);
  const userHasRated = userRatings[currentUserId];
  const averageRating = Object.keys(userRatings).length > 0
    ? Object.values(userRatings).reduce((sum, val) => sum + val, 0) / Object.keys(userRatings).length
    : 0;

  const displayValue = hoverValue || currentRating || averageRating;
  const currentRatingData = ratings[Math.round(displayValue) - 1] || ratings[2];
  const Icon = currentRatingData.icon;

  const handleRate = (value) => {
    if (!userHasRated) {
      onRate?.(postId, value, currentUserId);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="w-5 h-5" style={{ color: currentRatingData.color }} />
          </motion.div>
          <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
            Rate This Plate
          </span>
        </div>
        
        {Object.keys(userRatings).length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-white/40 text-xs">
              {Object.keys(userRatings).length} {Object.keys(userRatings).length === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
        )}
      </div>

      {/* Current Rating Display */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3 }}
        className="text-center mb-4"
      >
        <motion.p 
          className="text-lg font-black"
          style={{ color: currentRatingData.color }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {currentRatingData.label}
        </motion.p>
        {averageRating > 0 && (
          <p className="text-white/40 text-xs mt-1">
            Avg: {averageRating.toFixed(1)}/5
          </p>
        )}
      </motion.div>

      {/* Slider Track */}
      <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden mb-2">
        {/* Gradient Fill */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${(displayValue / 5) * 100}%`,
            background: `linear-gradient(to right, ${ratings[0].color}, ${ratings[4].color})`,
            boxShadow: `0 0 10px ${currentRatingData.color}`
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Interactive Touch Area */}
        {!userHasRated && (
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={displayValue}
            onChange={(e) => setHoverValue(parseFloat(e.target.value))}
            onMouseUp={(e) => handleRate(parseFloat(e.target.value))}
            onTouchEnd={(e) => {
              const value = parseFloat(e.target.value);
              handleRate(value);
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        )}
      </div>

      {/* Rating Labels */}
      <div className="flex justify-between items-center text-[9px] text-white/30 font-medium uppercase tracking-wider px-1">
        <span>Cheat</span>
        <span>Solid</span>
        <span>Elite</span>
      </div>

      {/* Status Message */}
      <div className="mt-3 text-center">
        {userHasRated ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-2 text-xs"
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: ratings[userRatings[currentUserId] - 1]?.color,
                boxShadow: `0 0 10px ${ratings[userRatings[currentUserId] - 1]?.color}`
              }}
            />
            <span className="text-white/60">
              You rated: {ratings[userRatings[currentUserId] - 1]?.label}
            </span>
          </motion.div>
        ) : (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/40 text-xs"
          >
            Slide to rate this nutrition
          </motion.p>
        )}
      </div>
    </div>
  );
}