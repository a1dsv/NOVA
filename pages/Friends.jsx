import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Users, MessageCircle, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState('username');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      if (!user) return [];
      const sent = await base44.entities.Friend.filter({ user_id: user.id }, '-created_date', 50);
      const received = await base44.entities.Friend.filter({ friend_id: user.id }, '-created_date', 50);
      return { sent, received };
    },
    enabled: !!user,
  });

  const acceptedFriends = [
    ...(friendRequests.sent || []).filter(f => f.status === 'accepted'),
    ...(friendRequests.received || []).filter(f => f.status === 'accepted'),
  ];

  const pendingRequests = (friendRequests.received || []).filter(f => f.status === 'pending');

  const sendRequestMutation = useMutation({
    mutationFn: async (query) => {
      // Use backend function to search users
      const response = await base44.functions.invoke('searchUser', {
        searchBy,
        query: query.toLowerCase()
      });
      
      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || `User not found with ${searchBy}: ${query}`);
      }
      
      const friend = response.data;
      
      if (friend.id === user.id) throw new Error('Cannot add yourself');
      
      // Check if already friends (either direction)
      const existingSent = await base44.entities.Friend.filter({
        user_id: user.id,
        friend_id: friend.id,
      }, '-created_date', 1);
      
      const existingReceived = await base44.entities.Friend.filter({
        user_id: friend.id,
        friend_id: user.id,
      }, '-created_date', 1);
      
      if (existingSent.length > 0 || existingReceived.length > 0) {
        const existing = existingSent[0] || existingReceived[0];
        if (existing.status === 'accepted') throw new Error('Already friends');
        if (existing.status === 'pending') throw new Error('Friend request already pending');
      }
      
      return base44.entities.Friend.create({
        user_id: user.id,
        friend_id: friend.id,
        user_name: user.full_name,
        friend_name: friend.full_name,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friend-requests']);
      setSearchQuery('');
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }) => {
      return base44.entities.Friend.update(requestId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friend-requests']);
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId) => {
      return base44.functions.invoke('removeFriend', { friendId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friend-requests']);
    },
    onError: (error) => {
      alert(error.message || 'Failed to remove friend');
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const members = [user.id, ...selectedFriends];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      return base44.entities.Circle.create({
        signal_id: null,
        name: groupName || 'Group Chat',
        members,
        expires_at: expiresAt.toISOString(),
        status: 'active',
      });
    },
    onSuccess: (circle) => {
      queryClient.invalidateQueries(['circles']);
      setShowGroupCreate(false);
      setSelectedFriends([]);
      setGroupName('');
      navigate(createPageUrl('CircleChat') + '?id=' + circle.id);
    },
  });

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold nova-gradient-text">Friends</h1>
          <p className="text-white/40 text-sm mt-1">Connect and chat with your tribe</p>
        </div>

        {/* Add Friend */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">Add Friend</h2>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setSearchBy('username')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                searchBy === 'username'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              Username
            </button>
            <button
              onClick={() => setSearchBy('email')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                searchBy === 'email'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              Email
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendRequestMutation.mutate(searchQuery)}
              placeholder={searchBy === 'username' ? 'Enter username...' : 'Enter email address...'}
              className="flex-1 bg-black/30 border-white/10 text-white"
            />
            <Button
              onClick={() => sendRequestMutation.mutate(searchQuery)}
              disabled={!searchQuery || sendRequestMutation.isPending}
              className="nova-gradient"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-semibold mb-3">Pending Requests</h2>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                        {request.user_name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">{request.user_name}</p>
                      <p className="text-white/40 text-xs">wants to connect</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateRequestMutation.mutate({ requestId: request.id, status: 'accepted' })}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRequestMutation.mutate({ requestId: request.id, status: 'rejected' })}
                      className="bg-white/5 border-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Create Group Chat */}
        {acceptedFriends.length > 0 && (
          <div className="mb-6">
            <Button
              onClick={() => setShowGroupCreate(!showGroupCreate)}
              className="w-full nova-gradient h-12"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Create Group Chat
            </Button>

            {showGroupCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-4"
              >
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="bg-black/30 border-white/10 text-white"
                />
                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Select friends:</p>
                  {acceptedFriends.map((friend) => {
                    const friendData = friend.user_id === user?.id 
                      ? { id: friend.friend_id, name: friend.friend_name }
                      : { id: friend.user_id, name: friend.user_name };
                    const isSelected = selectedFriends.includes(friendData.id);
                    
                    return (
                      <button
                        key={friend.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFriends(selectedFriends.filter(id => id !== friendData.id));
                          } else {
                            setSelectedFriends([...selectedFriends, friendData.id]);
                          }
                        }}
                        className={`w-full p-3 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/50'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                              {friendData.name?.charAt(0) || 'F'}
                            </div>
                          </div>
                          <span className="text-white">{friendData.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => createGroupMutation.mutate()}
                    disabled={selectedFriends.length === 0 || createGroupMutation.isPending}
                    className="flex-1 nova-gradient"
                  >
                    Create
                  </Button>
                  <Button
                    onClick={() => {
                      setShowGroupCreate(false);
                      setSelectedFriends([]);
                      setGroupName('');
                    }}
                    variant="outline"
                    className="flex-1 bg-white/5 border-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Friends List */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">My Friends ({acceptedFriends.length})</h2>
          </div>
          
          {acceptedFriends.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No friends yet</p>
              <p className="text-white/30 text-sm mt-1">Add friends to start chatting</p>
            </div>
          ) : (
            <div className="space-y-2">
              {acceptedFriends.map((friend) => {
                const friendData = friend.user_id === user?.id 
                  ? { id: friend.friend_id, name: friend.friend_name }
                  : { id: friend.user_id, name: friend.user_name };
                
                return (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                          {friendData.name?.charAt(0) || 'F'}
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium">{friendData.name}</p>
                        <p className="text-white/40 text-xs">Connected</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Remove ${friendData.name} from friends?`)) {
                          removeFriendMutation.mutate(friendData.id);
                        }
                      }}
                      disabled={removeFriendMutation.isPending}
                      className="bg-white/5 border-white/10 text-white/60 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}