import React, { useState } from 'react';
import { Star, Image, Link, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AnimatePresence } from 'framer-motion';
import AddSocialLinksModal from './AddSocialLinksModal';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ImproveTrustCard({ user }) {
  const navigate = useNavigate();
  const [showSocialModal, setShowSocialModal] = useState(false);
  
  const hasProfilePicture = !!user.profile_picture;
  const socialLinksCount = user.social_links 
    ? Object.values(user.social_links).filter(link => link && link.trim()).length 
    : 0;
  
  // Fetch actual friends count
  const { data: friends = [] } = useQuery({
    queryKey: ['user-friends-count', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allFriends = await base44.entities.Friend.filter({ status: 'accepted' });
      return allFriends.filter(f => f.user_id === user.id || f.friend_id === user.id);
    },
    enabled: !!user,
  });
  
  const friendsCount = friends.length;
  const hasFriends = friendsCount >= 3;

  const steps = [
    {
      id: 'profile_picture',
      label: 'Add Profile Picture',
      description: '+1 star',
      icon: Image,
      completed: hasProfilePicture,
      action: () => navigate(createPageUrl('Account'))
    },
    {
      id: 'social_links',
      label: 'Link Social Media',
      description: `+0.5 star per link (${socialLinksCount}/2)`,
      icon: Link,
      completed: socialLinksCount >= 2,
      progress: socialLinksCount,
      max: 2,
      action: () => setShowSocialModal(true)
    },
    {
      id: 'friends',
      label: 'Add Friends',
      description: `+1 star (${friendsCount}/3)`,
      icon: Users,
      completed: hasFriends,
      progress: friendsCount,
      max: 3,
      action: () => navigate(createPageUrl('Friends'))
    }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-sm">Improve Your Trust Rating</h3>
          <p className="text-white/40 text-xs">Complete these steps to increase your stars</p>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-white font-bold text-sm">{user.trust_stars || 3}/5</span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`border rounded-xl p-3 transition-all ${
                step.completed
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-white/10 bg-black/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  step.completed ? 'bg-green-500/20' : 'bg-white/5'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Icon className="w-5 h-5 text-white/40" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium text-sm ${
                      step.completed ? 'text-green-400' : 'text-white'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-white/40 text-xs">{step.description}</p>
                  </div>
                  
                  {step.progress !== undefined && !step.completed && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-400 transition-all"
                          style={{ width: `${(step.progress / step.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!step.completed && (
                  <Button
                    onClick={step.action}
                    size="sm"
                    className="bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 h-8 text-xs"
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Progress</span>
            <span className="text-cyan-400 font-medium">{completedSteps}/{totalSteps} completed</span>
          </div>
          <p className="text-white/40 text-xs">
            Base: 2 stars • Max: 5 stars • Cautions reduce rating by 1 star each
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showSocialModal && (
          <AddSocialLinksModal
            user={user}
            onClose={() => setShowSocialModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}