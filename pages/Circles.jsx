import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Clock, Music, ExternalLink, Zap, Moon, ChevronRight, UserPlus, Plus, Search } from 'lucide-react';
import CreateCommunityModal from '@/components/coaching/CreateCommunityModal';
import CommunitySearch from '@/components/coaching/CommunitySearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format, addHours, isAfter } from 'date-fns';
import CreateGroupModal from '@/components/circles/CreateGroupModal';

export default function Circles() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [coachingTab, setCoachingTab] = useState('communities');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Get circles where user is a member
  const { data: circles = [], isLoading } = useQuery({
    queryKey: ['circles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const allCircles = await base44.entities.Circle.filter({}, '-created_date', 100);
      return allCircles.filter(c => c.members?.includes(user.id) && c.status !== 'archived');
    },
    enabled: !!user?.id,
  });

  // Get associated signals for each circle
  const { data: signals = {} } = useQuery({
    queryKey: ['circle-signals', circles.map(c => c.signal_id)],
    queryFn: async () => {
      const signalIds = circles.map(c => c.signal_id).filter(Boolean);
      if (signalIds.length === 0) return {};
      
      const signalsData = await Promise.all(
        signalIds.map(async (id) => {
          try {
            const signalsList = await base44.entities.Signal.filter({ id }, '-created_date', 1);
            return signalsList[0];
          } catch {
            return null;
          }
        })
      );
      
      return signalsData.reduce((acc, signal) => {
        if (signal) acc[signal.id] = signal;
        return acc;
      }, {});
    },
    enabled: circles.length > 0,
  });

  // Get last messages for each circle
  const { data: lastMessages = {} } = useQuery({
    queryKey: ['circle-last-messages', circles.map(c => c.id)],
    queryFn: async () => {
      if (circles.length === 0) return {};
      
      const messagesData = await Promise.all(
        circles.map(async (circle) => {
          try {
            const msgs = await base44.entities.CircleMessage.filter(
              { circle_id: circle.id },
              '-created_date',
              1
            );
            return { circleId: circle.id, message: msgs[0] || null };
          } catch {
            return { circleId: circle.id, message: null };
          }
        })
      );
      
      return messagesData.reduce((acc, { circleId, message }) => {
        acc[circleId] = message;
        return acc;
      }, {});
    },
    enabled: circles.length > 0,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, members, admins }) => {
      return base44.entities.Circle.create({
        name,
        type: 'Social',
        members,
        admins: admins || [],
        status: 'active',
      });
    },
    onSuccess: (newCircle) => {
      queryClient.invalidateQueries(['circles']);
      setShowCreateModal(false);
      navigate(createPageUrl('CircleChat') + `?id=${newCircle.id}`);
    }
  });

  const getExpiryStatus = (expiresAt) => {
    if (!expiresAt) return { label: 'Active', color: 'text-green-400' };
    const expiry = new Date(expiresAt);
    const now = new Date();
    
    if (isAfter(now, expiry)) {
      return { label: 'Archived', color: 'text-white/40' };
    }
    
    return { 
      label: `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`, 
      color: 'text-amber-400' 
    };
  };

  // Fetch coaching communities
  const { data: communities = [] } = useQuery({
    queryKey: ['coaching-communities'],
    queryFn: async () => {
      const allCommunities = await base44.entities.CoachingCommunity.list('-created_date', 100);
      // Calculate visibility scores
      return allCommunities.map(c => ({
        ...c,
        visibility_score: ((c.members?.length || 0) * 2) + ((c.rating || 0) * 10) + ((c.total_ratings || 0) * 0.5)
      }));
    },
    enabled: activeTab === 'coaching',
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.CoachingCommunity.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaching-communities']);
      setShowCreateCommunity(false);
    }
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (community) => {
      const updatedMembers = [...(community.members || []), user.id];
      return base44.entities.CoachingCommunity.update(community.id, {
        members: updatedMembers
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaching-communities']);
    }
  });

  // Filter circles by type
  const eventCircles = circles.filter(c => c.signal_id);
  const socialCircles = circles.filter(c => !c.signal_id);
  const displayCircles = activeTab === 'events' ? eventCircles : socialCircles;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">Circles</h1>
            <Button
              onClick={() => navigate(createPageUrl('Friends'))}
              className="nova-gradient w-10 h-10 p-0"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1 flex gap-1">
          <motion.button
            onClick={() => setActiveTab('friends')}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'friends'
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Friends
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('events')}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'events'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Events
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('coaching')}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'coaching'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Coaching
          </motion.button>
        </div>
      </div>
      
      {/* Info Banner - Only for Events */}
      {activeTab === 'events' && (
        <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-white/10 rounded-2xl">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">Ephemeral by design</p>
              <p className="text-white/40 text-xs mt-1">
                Circle chats auto-destruct 48 hours after the event. Stay present, stay connected.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Content based on active tab */}
      {activeTab === 'coaching' ? (
        <div className="px-4 py-6">
          {/* Coaching Sub-tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCoachingTab('my')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                coachingTab === 'my'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              My Communities
            </button>
            <button
              onClick={() => setCoachingTab('search')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                coachingTab === 'search'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={() => setCoachingTab('newsfeed')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                coachingTab === 'newsfeed'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Newsfeed
            </button>
          </div>

          {coachingTab === 'my' ? (
            <div className="space-y-3">
              <Button
                onClick={() => setShowCreateCommunity(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black h-12 font-semibold mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>

              {communities.filter(c => c.members?.includes(user?.id)).length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <Users className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p>You haven't joined any communities yet</p>
                </div>
              ) : (
                communities.filter(c => c.members?.includes(user?.id)).map((community, index) => (
                  <motion.button
                    key={community.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(createPageUrl('Coaching') + `?id=${community.id}`)}
                    className="w-full text-left bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:border-amber-500/30 transition-all"
                  >
                    <h3 className="text-white font-semibold mb-1">{community.name}</h3>
                    <p className="text-white/40 text-sm mb-2">{community.description}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Users className="w-3 h-3" />
                      {community.members?.length || 0} members
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          ) : coachingTab === 'search' ? (
            <CommunitySearch
              communities={communities}
              onJoin={(community) => joinCommunityMutation.mutate(community)}
              userId={user?.id}
            />
          ) : (
            <div className="text-center py-12 text-white/40">
              Coaching newsfeed coming soon
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Circle List */}
      <div className="px-4 py-6 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayCircles.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">
              {activeTab === 'events' ? 'No event circles' : 'No friend groups yet'}
            </p>
            <p className="text-white/20 text-sm mt-1">
              {activeTab === 'events' 
                ? 'Join a signal to enter a circle' 
                : 'Start a chat with your workout partners!'}
            </p>
            {activeTab === 'friends' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 nova-gradient"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {displayCircles.map((circle, index) => {
              const signal = signals[circle.signal_id];
              const expiryStatus = getExpiryStatus(circle.expires_at);
              const isSyndicate = signal?.type === 'syndicate';
              const lastMsg = lastMessages[circle.id];
              
              return (
                <motion.button
                  key={circle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(createPageUrl('CircleChat') + `?id=${circle.id}`)}
                  className="w-full text-left"
                >
                  <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Circle Name & Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {circle.signal_id ? (
                            <>
                              <Badge 
                                className={`${
                                  isSyndicate 
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                } border`}
                              >
                                {isSyndicate ? <Zap className="w-3 h-3 mr-1" /> : <Moon className="w-3 h-3 mr-1" />}
                                {isSyndicate ? 'SYNDICATE' : 'UNWIND'}
                              </Badge>
                              <span className={`text-xs ${expiryStatus.color}`}>
                                {expiryStatus.label}
                              </span>
                            </>
                          ) : (
                            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 border">
                              <Users className="w-3 h-3 mr-1" />
                              GROUP CHAT
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-white font-semibold truncate mb-1">{circle.name}</h3>
                        
                        {/* Last Message Preview */}
                        {lastMsg && (
                          <p className="text-white/40 text-sm truncate">
                            {lastMsg.sender_id === user?.id ? 'You: ' : `${lastMsg.sender_name}: `}
                            {lastMsg.content}
                          </p>
                        )}
                        
                        {/* Meta Info */}
                        <div className="flex items-center gap-4 mt-2 text-white/40 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {circle.members?.length || 0}
                          </div>
                          {lastMsg && (
                            <>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(lastMsg.created_date), { addSuffix: true })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                    </div>
                    
                    {/* Music Link */}
                    {circle.music_link && (
                      <a
                        href={circle.music_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 hover:border-green-500/40 transition-colors"
                      >
                        <Music className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium flex-1">Join Shared Session</span>
                        <ExternalLink className="w-4 h-4 text-green-400" />
                      </a>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>
        </>
      )}

      {/* FAB - Create Group (Friends tab only) */}
      {activeTab === 'friends' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-32 right-6 z-[1000] w-16 h-16 rounded-full nova-gradient nova-glow-violet flex items-center justify-center shadow-xl"
        >
          <Plus className="w-8 h-8 text-white" />
        </motion.button>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(data) => createGroupMutation.mutate(data)}
        currentUserId={user?.id}
      />

      <CreateCommunityModal
        isOpen={showCreateCommunity}
        onClose={() => setShowCreateCommunity(false)}
        onCreate={(data) => createCommunityMutation.mutate(data)}
        userId={user?.id}
        userName={user?.full_name}
      />
    </div>
  );
}