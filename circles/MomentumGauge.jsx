import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp } from 'lucide-react';
import { startOfMonth } from 'date-fns';

export default function MomentumGauge({ circle }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const weekStart = startOfMonth(now);

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

  const totalMembers = circle.members?.length || 0;
  const membersWithQuests = quests.length;
  
  // Members who posted progress this week
  const membersWithWeeklyProgress = quests.filter(q => {
    const hasRecentProgress = q.progress_photos?.some(p => 
      new Date(p.uploaded_at) >= weekStart
    );
    return hasRecentProgress;
  }).length;

  const questPercentage = totalMembers > 0 ? (membersWithQuests / totalMembers) * 100 : 0;
  const progressPercentage = totalMembers > 0 ? (membersWithWeeklyProgress / totalMembers) * 100 : 0;
  const momentum = Math.round((questPercentage + progressPercentage) / 2);

  return (
    <div className="px-4 py-2 bg-black/50 border-b border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-white/60 text-xs uppercase tracking-wider">Circle Momentum</span>
        </div>
        <span className="text-cyan-400 text-sm font-bold">{momentum}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${momentum}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 text-[10px] text-white/40">
        <span>{membersWithQuests}/{totalMembers} set quest</span>
        <span>{membersWithWeeklyProgress}/{totalMembers} active this week</span>
      </div>
    </div>
  );
}