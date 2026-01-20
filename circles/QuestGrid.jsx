import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { differenceInDays, endOfMonth, format } from 'date-fns';
import QuestDetailModal from './QuestDetailModal';
import SetQuestModal from './SetQuestModal';

export default function QuestGrid({ circle, currentUserId }) {
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [editingQuest, setEditingQuest] = useState(null);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const daysLeft = differenceInDays(endOfMonth(now), now);

  // Fetch all quests for this circle this month
  const { data: quests = [] } = useQuery({
    queryKey: ['circle-quests', circle.id, month, year],
    queryFn: async () => {
      return base44.entities.MonthlyQuest.filter({
        circle_id: circle.id,
        month,
        year,
      }, '-created_date', 100);
    },
    enabled: !!circle.id,
    refetchInterval: 10000,
  });

  // Fetch member details
  const { data: members = [] } = useQuery({
    queryKey: ['quest-grid-members', circle.id],
    queryFn: async () => {
      if (!circle?.members) return [];
      const users = await base44.entities.User.list('-created_date', 200);
      return users.filter(u => circle.members.includes(u.id));
    },
    enabled: !!circle?.members,
  });

  // Create quest lookup
  const questsByUser = quests.reduce((acc, q) => {
    acc[q.user_id] = q;
    return acc;
  }, {});

  // Split current user and others
  const currentUser = members.find(m => m.id === currentUserId);
  const otherMembers = members.filter(m => m.id !== currentUserId);
  const myQuest = questsByUser[currentUserId];

  // Separate active and opted out members
  const activeMembers = otherMembers.filter(m => {
    const quest = questsByUser[m.id];
    return !quest || quest.status !== 'archived';
  });
  const optedOutMembers = otherMembers.filter(m => {
    const quest = questsByUser[m.id];
    return quest && quest.status === 'archived';
  });

  // Check if posted today
  const postedToday = (quest) => {
    if (!quest?.last_posted_date) return false;
    return new Date(quest.last_posted_date).toDateString() === new Date().toDateString();
  };

  const getProgressPercentage = (quest) => {
    if (!quest) return 0;
    return Math.min((quest.current_value / quest.target_value) * 100, 100);
  };

  const MemberCard = ({ member, quest, isCurrentUser = false, isOptedOut = false }) => {
    const hasQuest = !!quest && quest.status !== 'archived';
    const isActive = hasQuest && postedToday(quest);
    const isSlacking = hasQuest && !postedToday(quest);
    const progress = getProgressPercentage(quest);

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isCurrentUser && hasQuest) {
            setEditingQuest(quest);
          } else if (hasQuest) {
            setSelectedQuest(quest);
          }
        }}
        className={`relative ${isCurrentUser ? 'w-20 h-20' : 'w-16 h-16'} ${
          !hasQuest ? 'animate-pulse' : ''
        }`}
      >
        {/* Progress Ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={hasQuest ? "rgba(255,255,255,0.1)" : "#ef4444"}
            strokeWidth="4"
          />
          {hasQuest && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeDasharray={`${progress * 2.827} 282.7`}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Avatar */}
        <div className={`absolute inset-2 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold ${isCurrentUser ? 'text-xl' : 'text-sm'} ${isOptedOut ? 'opacity-30' : ''}`}>
          {member.full_name?.charAt(0) || 'U'}
        </div>

        {/* Status Emoji */}
        {hasQuest && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-xs">
            {isActive ? '🔥' : isSlacking ? '😴' : '⏳'}
          </div>
        )}

        {/* Name */}
        {isCurrentUser && (
          <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs whitespace-nowrap">
            You
          </p>
        )}
      </motion.button>
    );
  };

  return (
    <div className="px-4 py-4">
      {/* Gradient Definition */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2 mb-4 bg-white/5 rounded-xl py-2">
        <Clock className="w-4 h-4 text-amber-400" />
        <span className="text-white/60 text-sm">
          {daysLeft} days left in {format(now, 'MMMM')}
        </span>
      </div>

      {/* Current User - Centered Top */}
      {currentUser && (
        <div className="flex justify-center mb-6">
          <MemberCard member={currentUser} quest={myQuest} isCurrentUser />
        </div>
      )}

      {/* Active Members Grid */}
      {activeMembers.length > 0 && (
        <div className="grid grid-cols-4 gap-4 justify-items-center mb-4">
          {activeMembers.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-1">
              <MemberCard member={member} quest={questsByUser[member.id]} />
              <p className="text-white/40 text-[10px] truncate max-w-[60px] text-center">
                {member.full_name?.split(' ')[0] || 'User'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Opted Out Section */}
      {optedOutMembers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs text-center mb-3">Opted Out</p>
          <div className="grid grid-cols-4 gap-4 justify-items-center">
            {optedOutMembers.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-1">
                <MemberCard member={member} quest={questsByUser[member.id]} isOptedOut />
                <p className="text-white/30 text-[10px] truncate max-w-[60px] text-center">
                  {member.full_name?.split(' ')[0] || 'User'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quest Detail Modal */}
      {selectedQuest && (
        <QuestDetailModal
          quest={selectedQuest}
          onClose={() => setSelectedQuest(null)}
        />
      )}

      {editingQuest && (
        <SetQuestModal
          isOpen={true}
          onClose={() => setEditingQuest(null)}
          circleId={circle.id}
          userId={currentUserId}
          existingQuest={editingQuest}
          isEditing={true}
        />
      )}
    </div>
  );
}