import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Users, TrendingUp, Calendar, CheckCircle, Clock, X, Award } from 'lucide-react';
import TieredLeaderboard from '@/components/challenges/TieredLeaderboard';
import ProgressTracker from '@/components/challenges/ProgressTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Challenges() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    challenge_type: 'workouts',
    activity_type: 'any',
    target_value: 10,
    metric_unit: 'workouts',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const allChallenges = await base44.entities.Challenge.list('-created_date', 100);
      return allChallenges;
    },
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['participations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allParticipations = await base44.entities.ChallengeParticipation.list('-created_date', 100);
      return allParticipations.filter(p => p.user_id === user.id);
    },
    enabled: !!user,
  });

  const { data: allParticipations = [] } = useQuery({
    queryKey: ['all-participations'],
    queryFn: () => base44.entities.ChallengeParticipation.list('-created_date', 200),
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allFriends = await base44.entities.Friend.filter({ user_id: user.id, status: 'accepted' });
      return allFriends;
    },
    enabled: !!user,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Challenge.create({
        ...newChallenge,
        creator_id: user.id,
        creator_name: user.full_name,
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['challenges']);
      setShowCreate(false);
      setNewChallenge({
        title: '',
        description: '',
        challenge_type: 'workouts',
        activity_type: 'any',
        target_value: 10,
        metric_unit: 'workouts',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challenge) => {
      await base44.entities.ChallengeParticipation.create({
        challenge_id: challenge.id,
        user_id: user.id,
        user_name: user.full_name,
      });
      await base44.entities.Challenge.update(challenge.id, {
        participants_count: (challenge.participants_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['challenges']);
      queryClient.invalidateQueries(['participations']);
    },
  });

  const filteredChallenges = challenges.filter(c => {
    if (activeTab === 'active') return c.status === 'active';
    if (activeTab === 'my') return participations.some(p => p.challenge_id === c.id);
    return c.status === 'completed';
  });

  const isParticipating = (challengeId) => participations.some(p => p.challenge_id === challengeId);

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-white uppercase tracking-wider">Challenges</h1>
              <Button onClick={() => setShowCreate(true)} className="nova-gradient w-10 h-10 p-0">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-3">
              {['active', 'my', 'completed'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {tab === 'active' && 'Active'}
                  {tab === 'my' && 'My Challenges'}
                  {tab === 'completed' && 'Completed'}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Challenges List */}
        <div className="px-4 py-6 space-y-4">
          {filteredChallenges.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No challenges found</p>
            </div>
          ) : (
            filteredChallenges.map((challenge, idx) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{challenge.title}</h3>
                    <p className="text-white/60 text-sm mb-2">{challenge.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {challenge.challenge_type}
                      </Badge>
                      {challenge.activity_type !== 'any' && (
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                          {challenge.activity_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {challenge.status === 'active' && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                <div className="bg-black/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Target</p>
                      <p className="text-white font-bold text-2xl">
                        {challenge.target_value} {challenge.metric_unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs mb-1">Participants</p>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <p className="text-white font-bold">{challenge.participants_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-white/40 text-xs mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                  </div>
                  <div>by {challenge.creator_name}</div>
                </div>

                <div className="flex gap-2">
                  {!isParticipating(challenge.id) && challenge.status === 'active' && (
                    <motion.button
                      onClick={() => joinChallengeMutation.mutate(challenge)}
                      disabled={joinChallengeMutation.isPending}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="flex-1 nova-gradient h-10 rounded-lg flex items-center justify-center font-medium"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Join Challenge
                    </motion.button>
                  )}
                  {isParticipating(challenge.id) && (
                    <>
                      <motion.button
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setShowLeaderboard(false);
                        }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex-1 bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 h-10 rounded-lg flex items-center justify-center font-medium"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        My Progress
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setShowLeaderboard(true);
                        }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 h-10 rounded-lg flex items-center justify-center font-medium"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Leaderboard
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create Challenge Modal */}
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
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-lg">Create Challenge</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Title</label>
                  <Input
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                    placeholder="e.g., 100 Mile Week"
                    className="bg-black/30 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Description</label>
                  <Textarea
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    placeholder="What's this challenge about?"
                    className="bg-black/30 border-white/10 text-white min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Challenge Type</label>
                    <Select
                      value={newChallenge.challenge_type}
                      onValueChange={(val) => setNewChallenge({...newChallenge, challenge_type: val})}
                    >
                      <SelectTrigger className="bg-black/30 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workouts">Workouts</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="duration">Duration</SelectItem>
                        <SelectItem value="consistency">Consistency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Activity</label>
                    <Select
                      value={newChallenge.activity_type}
                      onValueChange={(val) => setNewChallenge({...newChallenge, activity_type: val})}
                    >
                      <SelectTrigger className="bg-black/30 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="run">Run</SelectItem>
                        <SelectItem value="gym">Gym</SelectItem>
                        <SelectItem value="calisthenics">Calisthenics</SelectItem>
                        <SelectItem value="martial_arts">Martial Arts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Target Value</label>
                    <Input
                      type="number"
                      value={newChallenge.target_value}
                      onChange={(e) => setNewChallenge({...newChallenge, target_value: Number(e.target.value)})}
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Unit</label>
                    <Input
                      value={newChallenge.metric_unit}
                      onChange={(e) => setNewChallenge({...newChallenge, metric_unit: e.target.value})}
                      placeholder="miles, lbs, reps"
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={newChallenge.start_date}
                      onChange={(e) => setNewChallenge({...newChallenge, start_date: e.target.value})}
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={newChallenge.end_date}
                      onChange={(e) => setNewChallenge({...newChallenge, end_date: e.target.value})}
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => createChallengeMutation.mutate()}
                  disabled={!newChallenge.title || createChallengeMutation.isPending}
                  className="w-full nova-gradient h-12"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Create Challenge
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Detail Modal */}
      <AnimatePresence>
        {selectedChallenge && (
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
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-lg">{selectedChallenge.title}</h2>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {showLeaderboard ? (
                <TieredLeaderboard
                  participations={allParticipations.filter(p => p.challenge_id === selectedChallenge.id)}
                  challenge={selectedChallenge}
                  userFriends={friends}
                />
              ) : (
                <ProgressTracker
                  participation={participations.find(p => p.challenge_id === selectedChallenge.id)}
                  challenge={selectedChallenge}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}