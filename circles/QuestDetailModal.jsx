import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function QuestDetailModal({ quest, onClose }) {
  // Fetch user details
  const { data: user } = useQuery({
    queryKey: ['user', quest.user_id],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date', 200);
      return users.find(u => u.id === quest.user_id);
    },
  });

  // Fetch recent posts for this quest
  const { data: posts = [] } = useQuery({
    queryKey: ['quest-posts', quest.id],
    queryFn: async () => {
      return base44.entities.QuestPost.filter({
        quest_id: quest.id,
      }, '-created_date', 10);
    },
  });

  const progressPercentage = Math.min((quest.current_value / quest.target_value) * 100, 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100000]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute left-0 right-0 bg-zinc-900 flex flex-col overflow-hidden"
          style={{ top: 0, bottom: '88px', height: 'calc(100vh - 88px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-zinc-900 border-b border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-white font-bold">{user?.full_name || 'User'}</h3>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5"
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>
            <h2 className="text-white font-bold text-xl">{quest.goal_title}</h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Progress Stats */}
            <div className="bg-zinc-800/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-violet-400" />
                  <span className="text-white font-medium">Progress</span>
                </div>
                <span className="text-white/60 text-sm">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full nova-gradient transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-white/60">Current:</span>
                  <span className="text-white font-bold">
                    {quest.current_value} {quest.metric_unit}
                  </span>
                </div>
                <div className="text-white/60">
                  Target: <span className="text-white font-bold">{quest.target_value} {quest.metric_unit}</span>
                </div>
              </div>
            </div>

            {/* Baseline Photo */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Baseline</p>
              <img 
                src={quest.baseline_photo_url} 
                alt="Baseline"
                className="w-full rounded-xl object-cover max-h-64"
              />
            </div>

            {/* Recent Updates */}
            {posts.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Recent Updates</p>
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-zinc-800/50 rounded-xl overflow-hidden">
                      <img 
                        src={post.photo_url} 
                        alt="Progress"
                        className="w-full object-cover max-h-48"
                      />
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium text-sm">
                            {post.current_value} / {post.target_value} {post.metric_unit}
                          </span>
                          <span className="text-white/40 text-xs">
                            {format(new Date(post.created_date), 'MMM d')}
                          </span>
                        </div>
                        {post.caption && (
                          <p className="text-white/60 text-sm">{post.caption}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}