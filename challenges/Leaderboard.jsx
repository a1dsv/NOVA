import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Leaderboard({ challengeId }) {
  const [users, setUsers] = useState([]);

  const { data: participations = [] } = useQuery({
    queryKey: ['leaderboard', challengeId],
    queryFn: async () => {
      const allParticipations = await base44.entities.ChallengeParticipation.list('-created_date', 100);
      return allParticipations
        .filter(p => p.challenge_id === challengeId)
        .sort((a, b) => (b.current_progress || 0) - (a.current_progress || 0));
    },
    enabled: !!challengeId,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (participations.length === 0) return;
      const userIds = [...new Set(participations.map(p => p.user_id))];
      const allUsers = await base44.entities.User.list('-created_date', 100);
      setUsers(allUsers.filter(u => userIds.includes(u.id)));
    };
    fetchUsers();
  }, [participations]);

  const getUserProfilePic = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.profile_picture;
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return 'from-amber-400 to-yellow-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-cyan-500 to-violet-500';
  };

  return (
    <div className="space-y-3">
      {participations.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No participants yet</p>
        </div>
      ) : (
        participations.map((participation, idx) => (
          <motion.div
            key={participation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4"
          >
            {/* Rank */}
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMedalColor(idx + 1)} flex items-center justify-center flex-shrink-0`}>
              {idx < 3 ? (
                <Trophy className="w-6 h-6 text-white" />
              ) : (
                <span className="text-white font-bold">{idx + 1}</span>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {getUserProfilePic(participation.user_id) ? (
                  <img 
                    src={getUserProfilePic(participation.user_id)} 
                    alt={participation.user_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                    {participation.user_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{participation.user_name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-white/40 text-sm">
                    Progress: {participation.current_progress || 0}
                  </p>
                  {participation.completed && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="text-right">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-bold">
                  {participation.current_progress || 0}
                </span>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}