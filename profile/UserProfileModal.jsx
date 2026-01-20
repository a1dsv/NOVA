import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Target, Radio, MessageCircle, Instagram, Twitter, Youtube, Linkedin, ExternalLink, Flag } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustRatingCard from './TrustRatingCard';
import LeaveTrustReviewModal from './LeaveTrustReviewModal';
import ImproveTrustCard from './ImproveTrustCard';

export default function UserProfileModal({ userId, onClose }) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profileUser, isLoading, isError } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getUsersByIds', { userIds: [userId] });
      const users = response.data?.users || [];
      return users[0];
    },
    enabled: !!userId,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['user-friends', userId],
    queryFn: async () => {
      const sent = await base44.entities.Friend.filter({ user_id: userId, status: 'accepted' });
      const received = await base44.entities.Friend.filter({ friend_id: userId, status: 'accepted' });
      return [...sent, ...received];
    },
    enabled: !!userId,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['user-goals', userId],
    queryFn: async () => {
      const allGoals = await base44.entities.Goal.filter({ user_id: userId });
      return allGoals.filter(g => g.status === 'active');
    },
    enabled: !!userId,
  });

  const { data: signals = [] } = useQuery({
    queryKey: ['user-signals', userId],
    queryFn: async () => {
      const allSignals = await base44.entities.Signal.filter({ host_id: userId, status: 'active' });
      return allSignals;
    },
    enabled: !!userId,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['user-communities', userId],
    queryFn: async () => {
      const allCommunities = await base44.entities.CoachingCommunity.list('-created_date', 100);
      return allCommunities.filter(c => c.members?.includes(userId));
    },
    enabled: !!userId,
  });

  const { data: captures = [] } = useQuery({
    queryKey: ['user-captures', userId],
    queryFn: async () => {
      const allCaptures = await base44.entities.Capture.filter({ user_id: userId }, '-created_date', 10);
      return allCaptures;
    },
    enabled: !!userId,
  });

  const { data: trustReviews = [] } = useQuery({
    queryKey: ['trust-reviews', userId],
    queryFn: async () => {
      const allReviews = await base44.entities.TrustReview.filter({ reviewed_user_id: userId }, '-created_date', 10);
      return allReviews;
    },
    enabled: !!userId,
  });

  const { data: sharedSignals = [] } = useQuery({
    queryKey: ['shared-signals', currentUser?.id, userId],
    queryFn: async () => {
      if (!currentUser) return [];
      
      // Get all completed signals where current user was approved
      const allSignalRequests = await base44.entities.SignalRequest.list('-created_date', 500);
      const currentUserSignals = allSignalRequests
        .filter(req => req.user_id === currentUser.id && req.status === 'approved')
        .map(req => req.signal_id);
      
      // Get signals where target user was also approved
      const targetUserSignals = allSignalRequests
        .filter(req => req.user_id === userId && req.status === 'approved')
        .map(req => req.signal_id);
      
      // Find intersection
      const sharedSignalIds = currentUserSignals.filter(id => targetUserSignals.includes(id));
      
      // Get actual signal objects
      const allSignals = await base44.entities.Signal.filter({ status: 'completed' });
      return allSignals.filter(signal => sharedSignalIds.includes(signal.id));
    },
    enabled: !!currentUser && !!userId && currentUser.id !== userId,
  });

  // Check if current user already reviewed this person
  const { data: existingReview } = useQuery({
    queryKey: ['my-review', currentUser?.id, userId],
    queryFn: async () => {
      if (!currentUser) return null;
      const reviews = await base44.entities.TrustReview.filter({
        reviewer_id: currentUser.id,
        reviewed_user_id: userId,
      });
      return reviews[0];
    },
    enabled: !!currentUser && !!userId && currentUser.id !== userId,
  });

  // Check if already friends or pending
  const { data: friendshipStatus } = useQuery({
    queryKey: ['friendship-status', currentUser?.id, userId],
    queryFn: async () => {
      if (!currentUser || currentUser.id === userId) return null;
      const sent = await base44.entities.Friend.filter({ user_id: currentUser.id, friend_id: userId });
      const received = await base44.entities.Friend.filter({ user_id: userId, friend_id: currentUser.id });
      return sent[0] || received[0] || null;
    },
    enabled: !!currentUser && currentUser.id !== userId,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (isError || !profileUser) return null;

  // Parse interests - handle both string and array formats
  const interestsList = profileUser.interests 
    ? (typeof profileUser.interests === 'string' 
        ? profileUser.interests.split(',').map(i => i.trim()).filter(Boolean)
        : Array.isArray(profileUser.interests) 
          ? profileUser.interests 
          : [])
    : [];

  const socialIcons = {
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
  };

  const canLeaveReview = currentUser && currentUser.id !== userId && sharedSignals.length > 0 && !existingReview;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10001] flex items-start justify-center pt-28 pb-24 px-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col relative"
          style={{ 
            maxHeight: 'calc(100vh - 11rem)'
          }}
        >
          {/* Close Button - Fixed Position */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/90 hover:bg-black flex items-center justify-center z-[100] border border-white/30 transition-colors shadow-xl"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Header with Profile Picture */}
          <div className="flex-shrink-0">
            <div className="h-32 bg-gradient-to-br from-violet-500/20 to-cyan-500/20" />
            
            <div className="px-6 pb-4">
              <div className="flex items-end gap-4 -mt-16">
                <button
                  onClick={() => setShowImageModal(true)}
                  className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-zinc-900 hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  {profileUser.profile_picture ? (
                    <img src={profileUser.profile_picture} alt={profileUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-3xl font-bold">
                      {profileUser.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>
                
                <div className="flex-1 pb-2">
                  <h2 className="text-white font-bold text-2xl">{profileUser.full_name}</h2>
                  <p className="text-white/60 text-sm">
                    {profileUser.username ? `@${profileUser.username}` : profileUser.email}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
            {/* Bio */}
            {profileUser.bio && (
              <p className="text-white/70 text-sm">{profileUser.bio}</p>
            )}

            {/* Trust Rating Card */}
            <TrustRatingCard user={profileUser} trustReviews={trustReviews} />

            {/* Show improvement card for own profile */}
            {currentUser && currentUser.id === userId && (
              <ImproveTrustCard user={profileUser} />
            )}

            {/* Leave Review Button */}
            {canLeaveReview && (
              <div>
                <p className="text-white/60 text-xs mb-2">
                  You attended {sharedSignals.length} event{sharedSignals.length !== 1 ? 's' : ''} together
                </p>
                <Button
                  onClick={() => {
                    setSelectedSignal(sharedSignals[0]);
                    setShowReviewModal(true);
                  }}
                  className="w-full bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Leave Trust Review
                </Button>
              </div>
            )}

            {existingReview && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <p className="text-cyan-400 text-xs">
                  ✓ You already reviewed this person as {existingReview.rating_type === 'safe' ? 'Safe' : 'Caution'}
                </p>
              </div>
            )}

            {/* Add Friend Button */}
            {currentUser && currentUser.id !== userId && !friendshipStatus && (
              <Button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await base44.entities.Friend.create({
                      user_id: currentUser.id,
                      friend_id: userId,
                      user_name: currentUser.full_name,
                      friend_name: profileUser.full_name,
                      status: 'pending',
                    });
                    queryClient.invalidateQueries(['friendship-status']);
                    queryClient.invalidateQueries(['friend-requests']);
                  } catch (error) {
                    console.error('Failed to send friend request:', error);
                  }
                }}
                className="w-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
              >
                <Users className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            )}

            {friendshipStatus && friendshipStatus.status === 'pending' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                <p className="text-amber-400 text-xs">
                  ⏳ Friend request pending
                </p>
              </div>
            )}

            {friendshipStatus && friendshipStatus.status === 'accepted' && (
              <div className="space-y-2">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-xs flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Friends
                  </p>
                </div>
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove ${profileUser.full_name} from friends?`)) {
                      try {
                        await base44.functions.invoke('removeFriend', { friendId: userId });
                        queryClient.invalidateQueries(['friendship-status']);
                        queryClient.invalidateQueries(['friend-requests']);
                        queryClient.invalidateQueries(['user-friends']);
                      } catch (error) {
                        console.error('Failed to remove friend:', error);
                      }
                    }
                  }}
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white/60 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
                >
                  Remove Friend
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-black/30 rounded-xl p-3 text-center">
                <Users className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                <p className="text-white font-bold">{friends.length}</p>
                <p className="text-white/40 text-xs">Friends</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 text-center">
                <Target className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-white font-bold">{goals.length}</p>
                <p className="text-white/40 text-xs">Goals</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 text-center">
                <Radio className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <p className="text-white font-bold">{signals.length}</p>
                <p className="text-white/40 text-xs">Signals</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 text-center">
                <MessageCircle className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold">{communities.length}</p>
                <p className="text-white/40 text-xs">Communities</p>
              </div>
            </div>

            {/* Interests */}
            {interestsList.length > 0 && (
              <div>
                <h3 className="text-white font-semibold text-sm mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interestsList.map((interest, idx) => (
                    <Badge key={idx} className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {profileUser.social_links && Object.keys(profileUser.social_links).filter(k => profileUser.social_links[k]).length > 0 && (
              <div>
                <h3 className="text-white font-semibold text-sm mb-2">Verified Social Media</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profileUser.social_links).filter(([_, url]) => url).map(([platform, url]) => {
                    const Icon = socialIcons[platform];
                    return (
                      <a
                        key={platform}
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-black/30 hover:bg-black/50 rounded-lg px-3 py-2 text-white/70 hover:text-white text-sm transition-colors border border-green-500/20"
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span className="capitalize">{platform}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Posts */}
            {captures.length > 0 && (
              <div>
                <h3 className="text-white font-semibold text-sm mb-3">Recent Posts</h3>
                <div className="grid grid-cols-3 gap-2">
                  {captures.slice(0, 6).map((capture) => (
                    <div key={capture.id} className="aspect-square rounded-lg overflow-hidden">
                      <img src={capture.image_url} alt={capture.caption} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Enlarged Profile Picture Modal */}
      <AnimatePresence>
        {showImageModal && profileUser.profile_picture && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-2xl w-full"
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <img
                src={profileUser.profile_picture}
                alt={profileUser.full_name}
                className="w-full aspect-square object-cover rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Trust Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedSignal && (
          <LeaveTrustReviewModal
            targetUser={profileUser}
            signal={selectedSignal}
            currentUser={currentUser}
            onClose={() => setShowReviewModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}