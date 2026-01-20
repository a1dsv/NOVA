import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MemberLedger({ circle }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: members = [] } = useQuery({
    queryKey: ['circle-members-ledger', circle?.id],
    queryFn: async () => {
      if (!circle?.members) return [];
      const users = await base44.entities.User.list('-created_date', 200);
      return users.filter(u => circle.members.includes(u.id));
    },
    enabled: !!circle?.members,
  });

  const { data: quests = [] } = useQuery({
    queryKey: ['monthly-quests', circle.id, month, year],
    queryFn: async () => {
      return base44.entities.MonthlyQuest.filter({
        circle_id: circle.id,
        month,
        year,
      }, '-created_date', 100);
    },
    enabled: !!circle?.id,
    refetchInterval: 10000,
  });

  const questsByUser = quests.reduce((acc, q) => {
    acc[q.user_id] = q;
    return acc;
  }, {});

  return (
    <div className="px-4 py-3 space-y-2">
      <h4 className="text-white/60 text-xs uppercase tracking-wider mb-2">Member Status</h4>
      {members.map((member, idx) => {
        const quest = questsByUser[member.id];
        const hasQuest = !!quest;
        const completed = quest?.status === 'completed';

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 p-2 bg-zinc-800/30 rounded-xl"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {member.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{member.full_name}</p>
              {hasQuest && quest.goal_title && (
                <p className="text-white/40 text-xs truncate">{quest.goal_title}</p>
              )}
            </div>
            <div>
              {completed ? (
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/50 rounded-full px-2 py-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 text-xs font-bold">Goal Achieved</span>
                </div>
              ) : hasQuest ? (
                <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/50 rounded-full px-2 py-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs font-bold">Quest Set</span>
                </div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1 bg-red-500/20 border border-red-500/50 rounded-full px-2 py-1"
                >
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 text-xs font-bold">No Quest</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}