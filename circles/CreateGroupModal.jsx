import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CreateGroupModal({ isOpen, onClose, onCreate, currentUserId }) {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Fetch friends
  const { data: friendships = [] } = useQuery({
    queryKey: ['friends', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const allFriendships = await base44.entities.Friend.filter({}, '-created_date', 100);
      return allFriendships.filter(
        f => f.status === 'accepted' && (f.user_id === currentUserId || f.friend_id === currentUserId)
      );
    },
    enabled: !!currentUserId && isOpen,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-group'],
    queryFn: async () => {
      const friendIds = friendships.map(f => 
        f.user_id === currentUserId ? f.friend_id : f.user_id
      );
      if (friendIds.length === 0) return [];
      return base44.entities.User.list('-created_date', 100);
    },
    enabled: friendships.length > 0 && isOpen,
  });

  const friends = users.filter(u => 
    friendships.some(f => 
      (f.user_id === currentUserId && f.friend_id === u.id) ||
      (f.friend_id === currentUserId && f.user_id === u.id)
    )
  );

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedFriends.length > 0) {
      onCreate({
        name: groupName.trim(),
        members: [currentUserId, ...selectedFriends],
        admins: [currentUserId]
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setGroupName('');
    setSelectedFriends([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
            <h2 className="text-white font-bold text-lg">
              {step === 1 ? 'Select Friends' : 'Name Group'}
            </h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/5"
            >
              <X className="w-5 h-5 text-white/60" />
            </Button>
          </div>

          <div className="p-4">
            {step === 1 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {friends.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <Users className="w-12 h-12 mx-auto mb-2 text-white/20" />
                    <p>No friends yet</p>
                    <p className="text-xs mt-1">Add friends first to create groups</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-cyan-500/20 border-2 border-cyan-400'
                          : 'bg-zinc-800/50 border-2 border-transparent hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
                          {friend.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{friend.full_name}</p>
                          <p className="text-white/40 text-xs">{friend.email}</p>
                        </div>
                      </div>
                      {selectedFriends.includes(friend.id) && (
                        <Check className="w-5 h-5 text-cyan-400" />
                      )}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div>
                <label className="text-white/60 text-sm mb-2 block">Group Name</label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Boxing Sparring Partners"
                  className="bg-black/30 border-white/10 text-white h-12"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 flex gap-3">
            {step === 2 && (
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 h-12 border-white/10 text-white hover:bg-white/5"
              >
                Back
              </Button>
            )}
            <Button
              onClick={() => step === 1 ? setStep(2) : handleCreate()}
              disabled={step === 1 ? selectedFriends.length === 0 : !groupName.trim()}
              className="flex-1 h-12 nova-gradient"
            >
              {step === 1 ? `Next (${selectedFriends.length})` : 'Create Group'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}