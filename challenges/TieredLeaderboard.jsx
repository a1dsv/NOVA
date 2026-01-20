import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TieredLeaderboard({ participations, challenge, userFriends = [] }) {
  const [activeLeaderboard, setActiveLeaderboard] = useState('global');

  // Sort by progress
  const sortedParticipations = [...participations].sort((a, b) => b.current_progress - a.current_progress);

  // Filter based on active leaderboard
  let displayedParticipations = sortedParticipations;
  if (activeLeaderboard === 'friends') {
    const friendIds = userFriends.map(f => f.friend_id);
    displayedParticipations = sortedParticipations.filter(p => friendIds.includes(p.user_id));
  } else if (activeLeaderboard === 'community' && challenge.circle_id) {
    // Would need to fetch circle members
    displayedParticipations = sortedParticipations;
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-white/40 text-sm font-bold">#{rank}</span>;
  };

  const progressPercent = (participation) => {
    return Math.min(100, (participation.current_progress / challenge.target_value) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Leaderboard Tabs */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-1 flex gap-1">
        <button
          onClick={() => setActiveLeaderboard('global')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
            activeLeaderboard === 'global'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setActiveLeaderboard('friends')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
            activeLeaderboard === 'friends'
              ? 'bg-violet-500/20 text-violet-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveLeaderboard('community')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
            activeLeaderboard === 'community'
              ? 'bg-amber-500/20 text-amber-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Community
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {displayedParticipations.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <Users className="w-8 h-8 mx-auto mb-2 text-white/20" />
            <p>No participants yet</p>
          </div>
        ) : (
          displayedParticipations.map((participation, index) => (
            <motion.div
              key={participation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900/50 border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">{participation.user_name}</p>
                    {participation.completed && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent(participation)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full nova-gradient"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/40 text-xs">
                        {participation.current_progress} / {challenge.target_value} {challenge.metric_unit}
                      </span>
                      <span className="text-cyan-400 text-xs font-medium">
                        {progressPercent(participation).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Points & Badges */}
                  {participation.points > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400 text-xs font-medium">
                        {participation.points} pts
                      </span>
                      {participation.badges_earned?.length > 0 && (
                        <span className="text-white/40 text-xs">
                          • {participation.badges_earned.length} badge{participation.badges_earned.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}