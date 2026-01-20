import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, UserPlus, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MemberListDrawer({ isOpen, onClose, circle, currentUserId, onMemberClick }) {
  const queryClient = useQueryClient();
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Fetch member details
  const { data: members = [] } = useQuery({
    queryKey: ['circle-members', circle?.id],
    queryFn: async () => {
      if (!circle?.members) return [];
      const response = await base44.functions.invoke('getUsersByIds', { userIds: circle.members });
      return response.data?.users || [];
    },
    enabled: !!circle && isOpen
  });

  // Fetch presence for all members
  const { data: presenceData = [] } = useQuery({
    queryKey: ['member-presence', circle?.id],
    queryFn: async () => {
      if (!circle?.members) return [];
      return base44.entities.UserPresence.list('-updated_date', 100);
    },
    enabled: !!circle?.members && isOpen,
    refetchInterval: 10000
  });

  const getPresenceStatus = (userId) => {
    const presence = presenceData.find((p) => p.user_id === userId);
    if (!presence) return 'offline';

    const lastSeen = new Date(presence.last_seen);
    const now = new Date();
    const minutesAgo = (now - lastSeen) / 1000 / 60;

    // Consider online if last seen within 2 minutes
    return minutesAgo < 2 ? 'online' : 'offline';
  };

  // Fetch friends to add
  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships-for-add', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const all = await base44.entities.Friend.filter({}, '-created_date', 100);
      return all.filter((f) =>
      f.status === 'accepted' && (
      f.user_id === currentUserId || f.friend_id === currentUserId)
      );
    },
    enabled: !!currentUserId && showAddFriends
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-add'],
    queryFn: async () => {
      const friendIds = friendships.map((f) =>
      f.user_id === currentUserId ? f.friend_id : f.user_id
      );
      if (friendIds.length === 0) return [];
      const response = await base44.functions.invoke('getUsersByIds', { userIds: friendIds });
      return response.data?.users || [];
    },
    enabled: showAddFriends && friendships.length > 0
  });

  const availableFriends = allUsers.filter((u) => {
    const isFriend = friendships.some((f) =>
    f.user_id === currentUserId && f.friend_id === u.id ||
    f.friend_id === currentUserId && f.user_id === u.id
    );
    const notInCircle = !circle?.members?.includes(u.id);
    return isFriend && notInCircle;
  });

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: async (newMemberIds) => {
      const updatedMembers = [...(circle.members || []), ...newMemberIds];
      return base44.entities.Circle.update(circle.id, { members: updatedMembers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle', circle.id]);
      queryClient.invalidateQueries(['circle-members']);
      setSelectedFriends([]);
      setShowAddFriends(false);
    }
  });

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
    prev.includes(friendId) ?
    prev.filter((id) => id !== friendId) :
    [...prev, friendId]
    );
  };

  const handleAddMembers = () => {
    if (selectedFriends.length > 0) {
      addMembersMutation.mutate(selectedFriends);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
        onClick={onClose}>

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-900 border-l border-white/10 overflow-y-auto">

          <div className="bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">
                {showAddFriends ? 'Add Friends' : 'Members'}
              </h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={showAddFriends ? () => setShowAddFriends(false) : onClose}
                className="w-10 h-10 rounded-full bg-white/5">

                <X className="w-5 h-5 text-white/60" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            {showAddFriends ?
            <div className="space-y-2">
                {availableFriends.length === 0 ?
              <div className="text-center py-12 text-white/40">
                    <UserPlus className="w-12 h-12 mx-auto mb-2 text-white/20" />
                    <p>No friends to add</p>
                  </div> :

              <>
                    {availableFriends.map((friend) =>
                <button
                  key={friend.id}
                  onClick={() => toggleFriend(friend.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedFriends.includes(friend.id) ?
                  'bg-cyan-500/20 border-2 border-cyan-400' :
                  'bg-zinc-800/50 border-2 border-transparent hover:bg-zinc-800'}`
                  }>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            {friend.profile_picture ?
                      <img
                        src={friend.profile_picture}
                        alt={friend.full_name}
                        className="w-full h-full object-cover" /> :


                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
                                {friend.full_name?.charAt(0) || 'U'}
                              </div>
                      }
                          </div>
                          <div className="text-left">
                            <p className="text-white font-medium">{friend.full_name}</p>
                          </div>
                        </div>
                        {selectedFriends.includes(friend.id) &&
                  <Check className="w-5 h-5 text-cyan-400" />
                  }
                      </button>
                )}

                    {selectedFriends.length > 0 &&
                <Button
                  onClick={handleAddMembers}
                  disabled={addMembersMutation.isPending}
                  className="w-full mt-4 h-12 nova-gradient">

                        Add {selectedFriends.length} Friend{selectedFriends.length > 1 ? 's' : ''}
                      </Button>
                }
                  </>
              }
              </div> :

            <div className="space-y-3">
                {members.map((member) => {
                const isOnline = getPresenceStatus(member.id) === 'online';
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      onMemberClick?.(member.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors text-left">

                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          {member.profile_picture ?
                        <img
                          src={member.profile_picture}
                          alt={member.full_name}
                          className="w-full h-full object-cover" /> :


                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-lg">
                              {member.full_name?.charAt(0) || 'U'}
                            </div>
                        }
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{member.full_name}</p>
                          {member.id === circle.created_by &&
                        <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        }
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-white/40 text-sm truncate">{member.email}</p>
                          {isOnline && <span className="text-green-500 text-xs">• Online</span>}
                        </div>
                      </div>
                    </button>);

              })}

                {!circle.signal_id &&
              <Button
                onClick={() => setShowAddFriends(true)}
                variant="outline" className="bg-cyan-500 text-slate-950 mt-4 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:bg-accent w-full h-12 border-dashed border-white/20 hover:border-cyan-400/40 hover:text-cyan-400">


                    <UserPlus className="w-5 h-5 mr-2" />
                    Add Friends
                  </Button>
              }
              </div>
            }
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

}