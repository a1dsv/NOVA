import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function GoalShareButton({ goal, circleId }) {
  const [isSharing, setIsSharing] = useState(false);
  const queryClient = useQueryClient();

  const shareGoalMutation = useMutation({
    mutationFn: async () => {
      // Get circle details
      const circles = await base44.entities.Circle.filter({ id: circleId });
      const circle = circles[0];
      
      if (!circle) throw new Error('Circle not found');

      // Calculate progress
      const progress = ((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100;
      const progressClamped = Math.max(0, Math.min(100, progress));

      // Create message content
      const content = `🎯 **Goal Update**\n\n**${goal.title}**${goal.exercise_name ? `\n${goal.exercise_name}` : ''}\n\n📊 Progress: ${progressClamped.toFixed(0)}%\n📈 ${goal.current_value} / ${goal.target_value} ${goal.metric_unit}\n\n${goal.notes ? `💭 "${goal.notes}"` : ''}`;

      // Send message to circle
      return base44.entities.CircleMessage.create({
        circle_id: circleId,
        sender_id: goal.user_id,
        sender_name: (await base44.auth.me()).full_name,
        content,
        type: 'text'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle-messages']);
      setIsSharing(false);
    }
  });

  return (
    <>
      <button
        onClick={() => setIsSharing(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm"
      >
        <Share2 className="w-4 h-4" />
        Share Progress
      </button>

      <AnimatePresence>
        {isSharing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsSharing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Share Goal Progress</h3>
                <button
                  onClick={() => setIsSharing(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <h4 className="text-white font-semibold mb-2">{goal.title}</h4>
                {goal.exercise_name && (
                  <p className="text-white/40 text-sm mb-3">{goal.exercise_name}</p>
                )}
                
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Progress</span>
                  <span className="text-cyan-400 font-bold">
                    {(((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, ((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100))}%` 
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm mt-3">
                  <span className="text-white/40">
                    {goal.current_value} / {goal.target_value} {goal.metric_unit}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setIsSharing(false)}
                  variant="outline"
                  className="flex-1 border-white/10 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => shareGoalMutation.mutate()}
                  disabled={shareGoalMutation.isPending}
                  className="flex-1 nova-gradient"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {shareGoalMutation.isPending ? 'Sharing...' : 'Share'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}