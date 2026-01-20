import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, Users, Star, Video, MessageSquare, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Coaching() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    focus_areas: [],
    is_public: true,
  });
  const [focusInput, setFocusInput] = useState('');

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: communities = [] } = useQuery({
    queryKey: ['coaching-communities'],
    queryFn: async () => {
      return base44.entities.CoachingCommunity.list('-created_date', 50);
    },
  });

  const myCommunities = communities.filter(c => 
    c.coach_id === user?.id || 
    c.assistant_coaches?.includes(user?.id) || 
    c.members?.includes(user?.id)
  );

  const createCommunityMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.CoachingCommunity.create({
        ...newCommunity,
        coach_id: user.id,
        coach_name: user.full_name,
        members: [],
        assistant_coaches: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaching-communities']);
      setShowCreate(false);
      setNewCommunity({ name: '', description: '', focus_areas: [], is_public: true });
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (community) => {
      const updatedMembers = [...(community.members || []), user.id];
      return base44.entities.CoachingCommunity.update(community.id, {
        members: updatedMembers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coaching-communities']);
    },
  });

  const addFocusArea = () => {
    if (focusInput.trim()) {
      setNewCommunity({
        ...newCommunity,
        focus_areas: [...newCommunity.focus_areas, focusInput.trim()],
      });
      setFocusInput('');
    }
  };

  const removeFocusArea = (index) => {
    setNewCommunity({
      ...newCommunity,
      focus_areas: newCommunity.focus_areas.filter((_, i) => i !== index),
    });
  };

  const filteredCommunities = activeTab === 'discover' 
    ? communities.filter(c => !c.members?.includes(user?.id) && c.is_public)
    : myCommunities;

  const isMember = (community) => community.members?.includes(user?.id);
  const isCoach = (community) => community.coach_id === user?.id || community.assistant_coaches?.includes(user?.id);

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">COACHING</h1>
                  <p className="text-white/40 text-xs uppercase tracking-widest">Expert Communities</p>
                </div>
              </div>
              <Button onClick={() => setShowCreate(true)} className="nova-gradient w-10 h-10 p-0">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {['discover', 'my'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {tab === 'discover' && 'Discover'}
                  {tab === 'my' && 'My Communities'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Communities List */}
        <div className="px-4 py-6 space-y-4">
          {filteredCommunities.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">
                {activeTab === 'discover' ? 'No communities available' : 'Not in any communities yet'}
              </p>
            </div>
          ) : (
            filteredCommunities.map((community, idx) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden"
              >
                {/* Banner */}
                <div className="relative h-32">
                  {community.image_url ? (
                    <img src={community.image_url} alt={community.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-orange-500/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">{community.name}</h3>
                      <p className="text-white/60 text-sm mb-3">{community.description}</p>
                      
                      {/* Focus Areas */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {community.focus_areas?.map((area, i) => (
                          <Badge key={i} className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Coach & Stats */}
                  <div className="flex items-center justify-between bg-black/30 rounded-xl p-4 mb-4">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Lead Coach</p>
                      <p className="text-white font-semibold">{community.coach_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs mb-1">Members</p>
                      <div className="flex items-center gap-1 justify-end">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <p className="text-white font-bold">{community.members?.length || 0}</p>
                        {community.max_members && (
                          <span className="text-white/40">/ {community.max_members}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isMember(community) && activeTab === 'discover' && (
                    <Button
                      onClick={() => joinCommunityMutation.mutate(community)}
                      disabled={joinCommunityMutation.isPending}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 h-10"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Join Community
                    </Button>
                  )}
                  {isMember(community) && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="border-white/10 text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      <Button variant="outline" className="border-white/10 text-white">
                        <Video className="w-4 h-4 mr-2" />
                        Submit Form
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-lg">Create Coaching Community</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Community Name</label>
                  <Input
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                    placeholder="e.g., Powerlifting Masters"
                    className="bg-black/30 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Description</label>
                  <Textarea
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                    placeholder="What does your community offer?"
                    className="bg-black/30 border-white/10 text-white min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Focus Areas</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={focusInput}
                      onChange={(e) => setFocusInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
                      placeholder="e.g., Bench Press"
                      className="bg-black/30 border-white/10 text-white flex-1"
                    />
                    <Button onClick={addFocusArea} size="icon" className="bg-white/5">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newCommunity.focus_areas.map((area, idx) => (
                      <Badge
                        key={idx}
                        className="bg-amber-500/20 text-amber-400 border-amber-500/30 cursor-pointer"
                        onClick={() => removeFocusArea(idx)}
                      >
                        {area} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => createCommunityMutation.mutate()}
                  disabled={!newCommunity.name || createCommunityMutation.isPending}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 h-12"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Create Community
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}