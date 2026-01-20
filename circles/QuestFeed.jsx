import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Send, X, Heart, MessageCircle, Smile, ChevronDown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import QuestGrid from './QuestGrid';
import SetQuestModal from './SetQuestModal';
import MonthlyQuestStats from './MonthlyQuestStats';
import InteractiveQuestCard from './InteractiveQuestCard';
import BlurRevealProof from './BlurRevealProof';
import NutritionRatingSlider from './NutritionRatingSlider';

export default function QuestFeed({ circleId, currentUserId, circle, onModalChange }) {
  const queryClient = useQueryClient();
  const [showPostModal, setShowPostModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentValue, setCurrentValue] = useState('');
  const [caption, setCaption] = useState('');
  const [expandedImage, setExpandedImage] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showQuestDropdown, setShowQuestDropdown] = useState(false);
  const [showSetQuest, setShowSetQuest] = useState(false);
  const [questStatsTab, setQuestStatsTab] = useState('grid');
  const [unveilers, setUnveilers] = useState({});
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  React.useEffect(() => {
    onModalChange?.(showPostModal);
  }, [showPostModal, onModalChange]);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Fetch current user's quest
  const { data: myQuest } = useQuery({
    queryKey: ['my-quest-feed', circleId, currentUserId, month, year],
    queryFn: async () => {
      const quests = await base44.entities.MonthlyQuest.filter({
        circle_id: circleId,
        user_id: currentUserId,
        month,
        year
      }, '-created_date', 1);
      return quests[0] || null;
    },
    enabled: !!circleId && !!currentUserId
  });

  // Fetch all posts
  const { data: posts = [] } = useQuery({
    queryKey: ['quest-feed', circleId],
    queryFn: async () => {
      return base44.entities.QuestPost.filter({
        circle_id: circleId
      }, 'created_date', 100);
    },
    enabled: !!circleId,
    refetchInterval: 3000
  });

  // Fetch all quests for context
  const { data: allQuests = [] } = useQuery({
    queryKey: ['all-circle-quests', circleId, month, year],
    queryFn: async () => {
      return base44.entities.MonthlyQuest.filter({
        circle_id: circleId,
        month,
        year
      }, '-created_date', 100);
    },
    enabled: !!circleId
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({ photoUrl, value, caption }) => {
      const targetReached = parseFloat(value) >= myQuest.target_value;
      const previousValue = myQuest.current_value || 0;

      const post = await base44.entities.QuestPost.create({
        quest_id: myQuest.id,
        circle_id: circleId,
        user_id: currentUserId,
        user_name: (await base44.auth.me()).full_name,
        photo_url: photoUrl,
        current_value: parseFloat(value),
        previous_value: previousValue,
        target_value: myQuest.target_value,
        metric_type: myQuest.metric_type,
        metric_unit: myQuest.metric_unit,
        caption: caption || '',
        unveilers: [],
        nutrition_ratings: {}
      });

      await base44.entities.MonthlyQuest.update(myQuest.id, {
        current_value: parseFloat(value),
        last_posted_date: new Date().toISOString(),
        status: targetReached ? 'completed' : 'active'
      });

      if (targetReached) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quest-feed']);
      queryClient.invalidateQueries(['my-quest-feed']);
      queryClient.invalidateQueries(['circle-quests']);
      setShowPostModal(false);
      setPhotoPreview(null);
      setCurrentValue('');
      setCaption('');
    }
  });

  // React to post mutation
  const reactMutation = useMutation({
    mutationFn: async ({ postId, emoji }) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const reactions = post.reactions || {};
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      const userIndex = reactions[emoji].indexOf(currentUserId);
      if (userIndex > -1) {
        reactions[emoji].splice(userIndex, 1);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].push(currentUserId);
      }

      return base44.entities.QuestPost.update(postId, { reactions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quest-feed']);
      setShowEmojiPicker(null);
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, text, replyToComment }) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const comments = post.comments || [];
      const newComment = {
        id: Date.now().toString(),
        user_id: currentUserId,
        user_name: (await base44.auth.me()).full_name,
        text,
        created_at: new Date().toISOString(),
        reply_to: replyToComment?.id || null
      };

      comments.push(newComment);
      return base44.entities.QuestPost.update(postId, { comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quest-feed']);
      setCommentText('');
      setReplyTo(null);
    }
  });

  // Tap to unveil mutation
  const tapToUnveilMutation = useMutation({
    mutationFn: async ({ postId, userId }) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const unveilers = post.unveilers || [];
      if (!unveilers.includes(userId)) {
        unveilers.push(userId);
      }

      return base44.entities.QuestPost.update(postId, { unveilers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quest-feed']);
    }
  });

  // Nutrition rating mutation
  const rateNutritionMutation = useMutation({
    mutationFn: async ({ postId, rating, userId }) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const nutritionRatings = post.nutrition_ratings || {};
      nutritionRatings[userId] = rating;

      return base44.entities.QuestPost.update(postId, { nutrition_ratings: nutritionRatings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quest-feed']);
    }
  });

  // Hype mutation
  const hypeMutation = useMutation({
    mutationFn: async ({ type, postId }) => {
      const emoji = type === 'fire' ? '🔥' : '⚡';
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const reactions = post.reactions || {};
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      if (!reactions[emoji].includes(currentUserId)) {
        reactions[emoji].push(currentUserId);
      }

      return base44.entities.QuestPost.update(postId, { reactions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quest-feed']);
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoPreview(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  // Scroll to bottom on new posts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const quickEmojis = ['🔥', '💪', '👏', '❤️', '😂', '🎯', '⚡', '🙌'];
  const allEmojis = ['🔥', '💪', '👏', '❤️', '😂', '🎯', '⚡', '🙌', '💯', '🚀', '👑', '💎', '🔱', '⭐', '✨', '💥', '🎉', '🏆', '🥇', '💀', '😈', '🤯', '🤘', '👊'];

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Quests Dropdown */}
      <div className="flex-shrink-0 border-b border-white/5">
        <button
          onClick={() => setShowQuestDropdown(!showQuestDropdown)}
          className="w-full px-4 py-3 flex items-center justify-between bg-violet-500/10 hover:bg-violet-500/20 transition-colors">

          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-400" />
            <span className="text-white font-medium text-sm">Monthly Quests</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showQuestDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showQuestDropdown &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">

              {/* Sub-tabs */}
              <div className="px-4 py-2 flex gap-2 bg-black/50 border-b border-white/5">
                <button
                  onClick={() => setQuestStatsTab('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    questStatsTab === 'grid'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setQuestStatsTab('stats')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    questStatsTab === 'stats'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  Progress Stats
                </button>
              </div>

              <div className="max-h-[40vh] overflow-y-auto bg-black/50">
                {questStatsTab === 'grid' ? (
                  <QuestGrid circle={circle} currentUserId={currentUserId} />
                ) : (
                  <MonthlyQuestStats circleId={circleId} />
                )}
              </div>
              
              {!myQuest &&
            <div className="p-3 border-t border-white/5">
                  <Button
                onClick={() => setShowSetQuest(true)}
                className="w-full nova-gradient h-10 text-sm">

                    <Trophy className="w-4 h-4 mr-2" />
                    Set Your Quest
                  </Button>
                </div>
            }
            </motion.div>
          }
        </AnimatePresence>
      </div>

      {/* Messages Area */}
      <div className="px-4 py-4 flex-1 overflow-y-auto space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {posts.length === 0 ?
        <div className="text-center py-20">
            <Camera className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No updates yet</p>
            <p className="text-white/20 text-sm mt-1">Share your first progress!</p>
          </div> :

        posts.map((post) => {
          const isOwn = post.user_id === currentUserId;
          const quest = allQuests.find(q => q.id === post.quest_id);
          const percentage = post.target_value ? (post.current_value / post.target_value) * 100 : 0;
          const isMilestone = percentage >= 100 || (percentage >= 75 && percentage < 100);
          const isNutritionGoal = quest?.metric_type === 'nutrition' || post.caption?.toLowerCase().includes('meal') || post.caption?.toLowerCase().includes('food');
          
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                {!isOwn &&
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {post.user_name?.charAt(0) || 'U'}
                  </div>
              }

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[75%]`}>
                  {!isOwn &&
                <p className="text-white/50 text-xs mb-1 px-2">{post.user_name}</p>
                }

                  {/* Interactive Quest Card for Major Progress */}
                  {quest && (post.previous_value && post.current_value - post.previous_value > quest.target_value * 0.1) && (
                    <div className="mb-2">
                      <InteractiveQuestCard 
                        quest={quest}
                        post={post}
                        currentUserId={currentUserId}
                        onHype={(type, postId) => hypeMutation.mutate({ type, postId })}
                      />
                    </div>
                  )}

                  <div className="rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/10 border-t-white/20">
                    {/* Image with Blur Reveal for Milestones */}
                    {isMilestone && percentage >= 100 ? (
                      <BlurRevealProof
                        photoUrl={post.photo_url}
                        postId={post.id}
                        requiredTaps={3}
                        unveilers={post.unveilers || []}
                        currentUserId={currentUserId}
                        onTapToUnveil={(postId, userId) => tapToUnveilMutation.mutate({ postId, userId })}
                      />
                    ) : (
                      <button
                        onClick={() => setExpandedImage(post.photo_url)}
                        className="w-full">
                        <img
                          src={post.photo_url}
                          alt="Progress"
                          className="w-full object-cover max-h-64 cursor-pointer" />
                      </button>
                    )}

                    {/* Content */}
                    <div className="p-3">
                      {post.caption &&
                    <p className="text-white text-sm mb-2">{post.caption}</p>
                    }
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-violet-400 text-xs font-medium font-mono">
                            {post.current_value}/{post.target_value} {post.metric_unit}
                          </p>
                          <p className="text-white/60 text-xs font-mono">
                            {Math.round(percentage)}%
                          </p>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                            style={{ 
                              boxShadow: percentage >= 75 ? '0 0 10px var(--nova-accent)' : 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nutrition Rating Slider */}
                    {isNutritionGoal && (
                      <div className="px-3">
                        <NutritionRatingSlider
                          postId={post.id}
                          currentRating={3}
                          userRatings={post.nutrition_ratings || {}}
                          currentUserId={currentUserId}
                          onRate={(postId, rating, userId) => rateNutritionMutation.mutate({ postId, rating, userId })}
                        />
                      </div>
                    )}

                    {/* Reactions */}
                    {post.reactions && Object.keys(post.reactions).length > 0 &&
                  <div className="px-3 pb-2 flex flex-wrap gap-1">
                        {Object.entries(post.reactions).map(([emoji, users]) => {
                          const userReacted = users.includes(currentUserId);
                          return (
                            <motion.button
                              key={emoji}
                              onClick={() => reactMutation.mutate({ postId: post.id, emoji })}
                              animate={userReacted ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.3 }}
                              className="px-2 py-0.5 rounded-full text-xs backdrop-blur-md border bg-white/[0.05] border-white/10"
                              style={userReacted ? { 
                                backgroundColor: `rgba(var(--nova-accent-rgb), 0.15)`,
                                boxShadow: '0 0 10px var(--nova-accent-glow)',
                                borderColor: 'var(--nova-accent)'
                              } : {}}>
                              {emoji} {users.length}
                            </motion.button>
                          );
                        })}
                      </div>
                  }

                    {/* Comments Preview */}
                    {post.comments && post.comments.length > 0 &&
                  <div className="px-3 pb-2">
                        <button
                      onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                      className="text-white/60 text-xs hover:text-white/80">

                          {showComments === post.id ? 'Hide' : 'View'} {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                        </button>
                      </div>
                  }
                    </div>

                    {/* Timestamp + Actions */}
                    <div className="flex items-center gap-3 mt-1 px-2">
                    <p className="text-white/40 text-xs">
                      {format(new Date(post.created_date), 'h:mm a')}
                    </p>
                    <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                    className="text-white/40 hover:text-white text-xs flex items-center gap-1">

                      <Smile className="w-3 h-3" />
                    </button>
                    <button
                    onClick={() => {
                      setShowComments(post.id);
                      setReplyTo(null);
                    }}
                    className="text-white/40 hover:text-white text-xs flex items-center gap-1">

                      <MessageCircle className="w-3 h-3" />
                      Comment
                    </button>
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker === post.id &&
                <div className="mt-2 px-2">
                      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl p-2 flex flex-wrap gap-1">
                        {allEmojis.map((emoji) =>
                    <button
                      key={emoji}
                      onClick={() => reactMutation.mutate({ postId: post.id, emoji })}
                      className="text-xl hover:scale-125 transition-transform">

                            {emoji}
                          </button>
                    )}
                      </div>
                    </div>
                }

                    {/* Comments Section */}
                    {showComments === post.id &&
                <div className="mt-2 px-2 space-y-2">
                      {(post.comments || []).map((comment) => {
                    const isReply = !!comment.reply_to;
                    const parentComment = isReply ? post.comments.find((c) => c.id === comment.reply_to) : null;

                    return (
                      <div key={comment.id} className={`${isReply ? 'ml-6' : ''}`}>
                            <div className={`rounded-lg p-2 border-t border-t-white/20 ${isReply ? 'bg-white/[0.02] backdrop-blur-sm border border-white/5' : 'bg-white/[0.03] backdrop-blur-md border border-white/10'}`}>
                              {isReply && parentComment &&
                          <p className="text-violet-400 text-xs mb-1">
                                  ↳ replying to {parentComment.user_name}
                                </p>
                          }
                              <p className="text-white/80 text-xs font-medium">{comment.user_name}</p>
                              <p className="text-white text-sm mt-0.5">{comment.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-white/40 text-xs">
                                  {format(new Date(comment.created_at), 'h:mm a')}
                                </p>
                                {!isReply &&
                            <button
                              onClick={() => setReplyTo(comment)}
                              className="text-violet-400 text-xs hover:text-violet-300">

                                    Reply
                                  </button>
                            }
                              </div>
                            </div>
                          </div>);

                  })}

                      {/* Comment Input - Floating Pill */}
                      <div className="flex gap-2 items-center bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 transition-all duration-300 focus-within:shadow-[0_0_20px_var(--nova-accent-glow)] focus-within:border-[var(--nova-accent)]">
                        {replyTo &&
                    <button
                      onClick={() => setReplyTo(null)}
                      className="text-white/40 hover:text-white">

                            <X className="w-4 h-4" />
                          </button>
                    }
                        <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={replyTo ? `Reply to ${replyTo.user_name}...` : 'Add a comment...'}
                      className="flex-1 bg-transparent border-none text-white text-sm h-8 focus:outline-none focus:ring-0"
                      style={{ boxShadow: 'none' }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && commentText.trim()) {
                          addCommentMutation.mutate({
                            postId: post.id,
                            text: commentText.trim(),
                            replyToComment: replyTo
                          });
                        }
                      }} />

                        <Button
                      onClick={() => addCommentMutation.mutate({
                        postId: post.id,
                        text: commentText.trim(),
                        replyToComment: replyTo
                      })}
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      className="h-8 w-8 px-0 rounded-full flex items-center justify-center nova-glow-active"
                      style={{ 
                        backgroundColor: 'var(--nova-accent)'
                      }}
                      size="sm">

                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                }
                    </div>
                    </motion.div>);

        })
        }
                    <div ref={messagesEndRef} />
                    </div>

      {/* Post Button */}
      {myQuest &&
      <div className="flex-shrink-0 p-3 border-t border-white/10 bg-zinc-900/95 backdrop-blur-xl">
          <Button
          onClick={() => setShowPostModal(true)}
          className="w-full nova-gradient h-12 flex items-center justify-center gap-2">

            <Camera className="w-5 h-5" />
            Post Update
          </Button>
        </div>
      }

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[100000] flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}>

            <img
            src={expandedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain" />

            <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">

              <X className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        }
      </AnimatePresence>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showPostModal &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[100000] flex items-end"
          onClick={() => setShowPostModal(false)}>

            <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-h-[80vh] bg-zinc-900 rounded-t-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>

              <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Post Progress</h3>
                <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPostModal(false)}
                className="w-10 h-10 rounded-full bg-white/5">

                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden" />


                {photoPreview ?
              <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-full rounded-xl max-h-64 object-cover" />
                    <button
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">

                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div> :

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-48 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2">

                    {uploading ?
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :

                <>
                        <Camera className="w-8 h-8 text-white/40" />
                        <p className="text-white/40 text-sm">Upload photo</p>
                      </>
                }
                  </button>
              }

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Current Progress ({myQuest?.metric_unit})
                  </label>
                  <Input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder={`${myQuest?.current_value || 0}`}
                  className="bg-zinc-800 border-white/10 text-white" />

                  <p className="text-white/40 text-xs mt-1">
                    Target: {myQuest?.target_value} {myQuest?.metric_unit}
                  </p>
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Caption</label>
                  <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="How's it going?"
                  className="bg-zinc-800 border-white/10 text-white resize-none"
                  rows={3} />

                </div>
              </div>
              
              <div className="flex-shrink-0 p-4 border-t border-white/10">
                <Button
                onClick={() => createPostMutation.mutate({
                  photoUrl: photoPreview,
                  value: currentValue,
                  caption
                })}
                disabled={!photoPreview || !currentValue.trim() || createPostMutation.isPending}
                className="w-full nova-gradient h-12">

                  {createPostMutation.isPending ? 'Posting...' : 'Post Update'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        }
          </AnimatePresence>

          {/* Set Quest Modal */}
          <SetQuestModal
        isOpen={showSetQuest}
        onClose={() => setShowSetQuest(false)}
        circleId={circleId}
        userId={currentUserId} />

          </div>);

}