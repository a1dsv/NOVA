import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Target, ChevronRight } from 'lucide-react';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import UserProfileModal from '@/components/profile/UserProfileModal';

export default function MonthlyQuestStats({ circleId }) {
  const [selectedUserId, setSelectedUserId] = useState(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Fetch all quests for this circle
  const { data: quests = [] } = useQuery({
    queryKey: ['monthly-quests-stats', circleId, month, year],
    queryFn: async () => {
      const allQuests = await base44.entities.MonthlyQuest.filter({
        circle_id: circleId,
        month,
        year,
      }, '-created_date', 100);
      return allQuests;
    },
    enabled: !!circleId,
  });

  // Fetch user details
  const { data: users = [] } = useQuery({
    queryKey: ['quest-users', circleId],
    queryFn: async () => {
      const userIds = [...new Set(quests.map(q => q.user_id))];
      if (userIds.length === 0) return [];
      const allUsers = await base44.entities.User.list('-created_date', 100);
      return allUsers.filter(u => userIds.includes(u.id));
    },
    enabled: quests.length > 0,
  });

  const getUserById = (userId) => users.find(u => u.id === userId);

  const calculateProgress = (quest) => {
    if (quest.metric_type === 'time') {
      // For time metrics, calculate total seconds
      const totalSeconds = 
        (quest.time_hours || 0) * 3600 + 
        (quest.time_minutes || 0) * 60 + 
        (quest.time_seconds || 0);
      const targetSeconds = quest.target_value;
      return (totalSeconds / targetSeconds) * 100;
    }
    return ((quest.current_value - (quest.start_value || 0)) / (quest.target_value - (quest.start_value || 0))) * 100;
  };

  if (quests.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">No quests set yet</p>
      </div>
    );
  }

  // Sort by progress
  const sortedQuests = [...quests].sort((a, b) => {
    const progressA = calculateProgress(a);
    const progressB = calculateProgress(b);
    return progressB - progressA;
  });

  return (
    <>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Member Progress</h3>
          <div className="text-white/40 text-xs">
            {quests.filter(q => q.status === 'completed').length}/{quests.length} completed
          </div>
        </div>

        <div className="space-y-3">
          {sortedQuests.map((quest, index) => {
            const user = getUserById(quest.user_id);
            const progress = calculateProgress(quest);
            const progressClamped = Math.max(0, Math.min(100, progress));
            const isCompleted = quest.status === 'completed';

            return (
              <motion.button
                key={quest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedUserId(quest.user_id)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:bg-zinc-900/70 transition-colors text-left"
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Profile Picture */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {user?.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-lg font-bold">
                        {user?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-semibold">{user?.full_name || 'Unknown'}</p>
                      {isCompleted && (
                        <Trophy className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-white/60 text-sm truncate">{quest.goal_title}</p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0" />
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/40">Progress</span>
                    <span className={`font-bold ${
                      isCompleted 
                        ? 'text-green-400' 
                        : progressClamped >= 75 
                          ? 'text-cyan-400' 
                          : 'text-white/60'
                    }`}>
                      {progressClamped.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressClamped}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={`h-full ${
                        isCompleted 
                          ? 'bg-green-500' 
                          : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-white/40">
                    <Target className="w-3 h-3" />
                    {quest.metric_type === 'time' ? (
                      <span>
                        {quest.time_hours || 0}h {quest.time_minutes || 0}m / {Math.floor(quest.target_value / 3600)}h {Math.floor((quest.target_value % 3600) / 60)}m
                      </span>
                    ) : (
                      <span>
                        {quest.current_value} / {quest.target_value} {quest.metric_unit}
                      </span>
                    )}
                  </div>
                  {quest.progress_photos?.length > 0 && (
                    <div className="flex items-center gap-1 text-white/40">
                      <TrendingUp className="w-3 h-3" />
                      {quest.progress_photos.length} updates
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </>
  );
}