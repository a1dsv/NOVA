import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, UserPlus, UserMinus, LogOut, AlertTriangle, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GroupSettingsModal({ isOpen, onClose, circle, currentUserId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(null);
  const [selectedForAdmin, setSelectedForAdmin] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = circle?.admins?.includes(currentUserId);

  // Fetch member details
  const { data: members = [] } = useQuery({
    queryKey: ['circle-members-settings', circle?.id],
    queryFn: async () => {
      if (!circle?.members) return [];
      const users = await base44.entities.User.list('-created_date', 200);
      return users.filter(u => circle.members.includes(u.id));
    },
    enabled: !!circle?.members && isOpen,
  });

  // Fetch friends for adding
  const { data: availableFriends = [] } = useQuery({
    queryKey: ['available-friends', currentUserId, circle?.id],
    queryFn: async () => {
      const friendships = await base44.entities.Friend.filter(
        { status: 'accepted' },
        '-created_date',
        200
      );
      const friendIds = friendships
        .filter(f => f.user_id === currentUserId || f.friend_id === currentUserId)
        .map(f => f.user_id === currentUserId ? f.friend_id : f.user_id);
      
      const users = await base44.entities.User.list('-created_date', 200);
      return users.filter(u => friendIds.includes(u.id) && !circle?.members?.includes(u.id));
    },
    enabled: !!currentUserId && !!circle?.members && isOpen,
  });

  // Fetch pending member requests (for admins)
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['circle-member-requests', circle?.id],
    queryFn: async () => {
      return base44.entities.CircleMemberRequest.filter(
        { circle_id: circle.id, status: 'pending' },
        '-created_date',
        50
      );
    },
    enabled: !!circle?.id && isAdmin && isOpen,
  });

  // Make admin mutation
  const makeAdminMutation = useMutation({
    mutationFn: async (userId) => {
      const newAdmins = [...(circle.admins || []), userId];
      return base44.entities.Circle.update(circle.id, { admins: newAdmins });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle', circle.id]);
      setSelectedForAdmin(null);
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (userId) => {
      const newAdmins = circle.admins.filter(id => id !== userId);
      return base44.entities.Circle.update(circle.id, { admins: newAdmins });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle', circle.id]);
    },
  });

  // Kick member mutation
  const kickMutation = useMutation({
    mutationFn: async (userId) => {
      const newMembers = circle.members.filter(id => id !== userId);
      const newAdmins = circle.admins?.filter(id => id !== userId) || [];
      return base44.entities.Circle.update(circle.id, { 
        members: newMembers,
        admins: newAdmins 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle', circle.id]);
      setShowKickConfirm(null);
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userId) => {
      const newMembers = [...circle.members, userId];
      return base44.entities.Circle.update(circle.id, { members: newMembers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle', circle.id]);
    },
  });

  // Request member mutation (for non-admins)
  const requestMemberMutation = useMutation({
    mutationFn: async ({ userId, userName }) => {
      const currentUser = await base44.auth.me();
      return base44.entities.CircleMemberRequest.create({
        circle_id: circle.id,
        requester_id: currentUser.id,
        requester_name: currentUser.full_name,
        requested_user_id: userId,
        requested_user_name: userName,
        status: 'pending',
      });
    },
    onSuccess: () => {
      setShowRequestModal(false);
      queryClient.invalidateQueries(['circle-member-requests', circle.id]);
    },
  });

  // Delete group mutation (admins only)
  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Circle.update(circle.id, { status: 'archived' });
    },
    onSuccess: () => {
      navigate(createPageUrl('Circles'));
    },
  });

  // Approve member request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async (request) => {
      const newMembers = [...circle.members, request.requested_user_id];
      await base44.entities.Circle.update(circle.id, { members: newMembers });
      await base44.entities.CircleMemberRequest.update(request.id, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle', circle.id]);
      queryClient.invalidateQueries(['circle-member-requests', circle.id]);
    },
  });

  // Reject member request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return base44.entities.CircleMemberRequest.update(requestId, { status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle-member-requests', circle.id]);
    },
  });

  // Leave group mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      const newMembers = circle.members.filter(id => id !== currentUserId);
      const newAdmins = circle.admins?.filter(id => id !== currentUserId) || [];
      
      if (newMembers.length === 0) {
        // If last member, archive the circle
        return base44.entities.Circle.update(circle.id, { status: 'archived' });
      }
      
      // If leaving admin and no admins left, make first member admin
      if (isAdmin && newAdmins.length === 0 && newMembers.length > 0) {
        newAdmins.push(newMembers[0]);
      }
      
      return base44.entities.Circle.update(circle.id, { 
        members: newMembers,
        admins: newAdmins 
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('Circles'));
    },
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[999999] flex flex-col"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="w-full h-full bg-zinc-900 overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-2xl">Group Settings</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10"
                >
                  <X className="w-6 h-6 text-white" />
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="p-4 space-y-3">
              {/* Add Member Button - For Admins */}
              {isAdmin && (
                <Button
                  onClick={() => setSelectedForAdmin('add')}
                  className="w-full nova-gradient h-12 text-base font-semibold mb-4"
                  disabled={availableFriends.length === 0}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {availableFriends.length > 0 ? 'Add Members' : 'No Friends Available'}
                </Button>
              )}
              
              {/* Request Member Button - For Non-Admins */}
              {!isAdmin && (
                <Button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border-2 border-violet-500/50 h-12 text-base font-semibold mb-4"
                  disabled={availableFriends.length === 0}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {availableFriends.length > 0 ? 'Request Member' : 'No Friends to Add'}
                </Button>
              )}

              {/* Pending Requests - For Admins */}
              {isAdmin && pendingRequests.length > 0 && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <h3 className="text-amber-400 font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pending Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">
                            <span className="font-medium">{request.requester_name}</span>
                            <span className="text-white/60"> wants to add </span>
                            <span className="font-medium">{request.requested_user_name}</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => approveRequestMutation.mutate(request)}
                          disabled={approveRequestMutation.isPending}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50 h-8"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => rejectRequestMutation.mutate(request.id)}
                          disabled={rejectRequestMutation.isPending}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/60 text-xs uppercase tracking-wider">Members ({members.length})</p>
                {isAdmin && (
                  <span className="text-violet-400 text-xs flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    You're an admin
                  </span>
                )}
              </div>
              {members.map((member) => {
                const isMemberAdmin = circle.admins?.includes(member.id);
                const isCreator = circle.created_by === member.id;
                const isCurrentUser = member.id === currentUserId;

                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {member.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {member.full_name}
                        {isCurrentUser && ' (You)'}
                      </p>
                      <div className="flex items-center gap-2">
                        {isCreator && (
                          <span className="text-amber-400 text-xs flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Creator
                          </span>
                        )}
                        {isMemberAdmin && !isCreator && (
                          <span className="text-violet-400 text-xs flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Controls - Only show for admins, not for self or creator */}
                    {isAdmin && !isCurrentUser && !isCreator && (
                      <div className="flex flex-col gap-1">
                        {!isMemberAdmin ? (
                          <Button
                            size="sm"
                            onClick={() => makeAdminMutation.mutate(member.id)}
                            disabled={makeAdminMutation.isPending}
                            className="bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30 h-8 text-xs"
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            Make Admin
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => removeAdminMutation.mutate(member.id)}
                            disabled={removeAdminMutation.isPending}
                            className="bg-white/5 text-white/60 hover:bg-white/10 border border-white/10 h-8 text-xs"
                          >
                            Remove Admin
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => setShowKickConfirm(member.id)}
                          disabled={kickMutation.isPending}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-8 text-xs"
                        >
                          <UserMinus className="w-3 h-3 mr-1" />
                          Kick Out
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>



            {/* Leave Group - Available to All */}
            <div className="sticky bottom-0 bg-zinc-900 p-4 border-t border-white/10 mt-auto space-y-2">
              {isAdmin && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-600/30 text-red-300 hover:bg-red-600/40 border-2 border-red-600 h-12 text-base font-semibold"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Group
                </Button>
              )}
              <Button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500 h-12 text-base font-semibold"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Leave Group
              </Button>
            </div>

            {/* Leave Confirmation */}
            {showLeaveConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100001] p-4">
                <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg text-center mb-2">Leave Group?</h3>
                  <p className="text-white/60 text-sm text-center mb-6">
                    You'll no longer receive messages from this group.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowLeaveConfirm(false)}
                      variant="ghost"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => leaveMutation.mutate()}
                      disabled={leaveMutation.isPending}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Members Modal - For Admins */}
            {selectedForAdmin === 'add' && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100001] p-4">
                <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full max-h-[70vh] overflow-y-auto">
                  <h3 className="text-white font-bold text-lg mb-4">Add Members</h3>
                  <div className="space-y-2">
                    {availableFriends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {friend.full_name?.charAt(0) || 'U'}
                        </div>
                        <p className="text-white font-medium flex-1">{friend.full_name}</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            addMemberMutation.mutate(friend.id);
                            setSelectedForAdmin(null);
                          }}
                          disabled={addMemberMutation.isPending}
                          className="nova-gradient"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setSelectedForAdmin(null)}
                    variant="outline"
                    className="w-full mt-4 border-white/10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Request Members Modal - For Non-Admins */}
            {showRequestModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100001] p-4">
                <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full max-h-[70vh] overflow-y-auto">
                  <h3 className="text-white font-bold text-lg mb-4">Request Members</h3>
                  <p className="text-white/60 text-sm mb-4">Admins will see your request in the group chat</p>
                  <div className="space-y-2">
                    {availableFriends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {friend.full_name?.charAt(0) || 'U'}
                        </div>
                        <p className="text-white font-medium flex-1">{friend.full_name}</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            requestMemberMutation.mutate({ userId: friend.id, userName: friend.full_name });
                          }}
                          disabled={requestMemberMutation.isPending}
                          className="bg-violet-500/20 text-violet-400 border border-violet-500/50"
                        >
                          Request
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setShowRequestModal(false)}
                    variant="outline"
                    className="w-full mt-4 border-white/10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Kick Confirmation */}
            {showKickConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100001] p-4">
                <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg text-center mb-2">Remove Member?</h3>
                  <p className="text-white/60 text-sm text-center mb-6">
                    {members.find(m => m.id === showKickConfirm)?.full_name} will be removed from the group.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowKickConfirm(null)}
                      variant="ghost"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => kickMutation.mutate(showKickConfirm)}
                      disabled={kickMutation.isPending}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Group Confirmation */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100001] p-4">
                <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg text-center mb-2">Delete Group?</h3>
                  <p className="text-white/60 text-sm text-center mb-6">
                    This will permanently delete the group for all members. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="ghost"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => deleteGroupMutation.mutate()}
                      disabled={deleteGroupMutation.isPending}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </motion.div>
            </motion.div>
            </AnimatePresence>
            );
            }