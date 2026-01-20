import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Send, Music, ExternalLink, Users, Clock,
  MoreVertical, Info, Zap, Moon, Image as ImageIcon, X, Camera, Trophy, Settings } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import MemberListDrawer from '@/components/circles/MemberListDrawer';
import MemoryGallery from '@/components/circles/MemoryGallery';
import CircleTabsHeader from '@/components/circles/CircleTabsHeader';
import SetQuestModal from '@/components/circles/SetQuestModal';
import GroupSettingsModal from '@/components/circles/GroupSettingsModal';
import MessageBubble from '@/components/circles/MessageBubble';
import UserProfileModal from '@/components/profile/UserProfileModal';
import TypingIndicator from '@/components/circles/TypingIndicator';
import MentionInput from '@/components/circles/MentionInput';
import confetti from 'canvas-confetti';

export default function CircleChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSetQuest, setShowSetQuest] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const burnMode = activeTab === 'burn';
  const feedMode = activeTab === 'feed';

  const urlParams = new URLSearchParams(window.location.search);
  const circleId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Update presence to online
      if (currentUser?.id) {
        try {
          const allPresence = await base44.entities.UserPresence.list('-created_date', 100);
          const existingPresence = allPresence.filter(p => p.user_id === currentUser.id);
          
          if (existingPresence.length > 0) {
            await base44.entities.UserPresence.update(existingPresence[0].id, {
              status: 'online',
              last_seen: new Date().toISOString()
            });
          } else {
            await base44.entities.UserPresence.create({
              user_id: currentUser.id,
              status: 'online',
              last_seen: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to update presence:', error);
        }
      }
    };
    loadUser();
    
    // Update presence every 30 seconds
    const presenceInterval = setInterval(async () => {
      if (user?.id) {
        try {
          const allPresence = await base44.entities.UserPresence.list('-created_date', 100);
          const existingPresence = allPresence.filter(p => p.user_id === user.id);
          
          if (existingPresence.length > 0) {
            await base44.entities.UserPresence.update(existingPresence[0].id, {
              status: 'online',
              last_seen: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to update presence:', error);
        }
      }
    }, 30000);
    
    // Set offline on unmount
    return () => {
      clearInterval(presenceInterval);
      if (user?.id) {
        const setOffline = async () => {
          try {
            const allPresence = await base44.entities.UserPresence.list('-created_date', 100);
            const existingPresence = allPresence.filter(p => p.user_id === user.id);
            
            if (existingPresence.length > 0) {
              await base44.entities.UserPresence.update(existingPresence[0].id, {
                status: 'offline',
                last_seen: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('Failed to set offline:', error);
          }
        };
        setOffline();
      }
    };
  }, [user?.id]);

  // Fetch circle
  const { data: circle } = useQuery({
    queryKey: ['circle', circleId],
    queryFn: async () => {
      const circles = await base44.entities.Circle.list('-created_date', 100);
      return circles.find(c => c.id === circleId);
    },
    enabled: !!circleId,
    refetchInterval: 5000 // Refresh for member updates
  });

  // Fetch member details for avatars
  const { data: memberDetails = [] } = useQuery({
    queryKey: ['circle-member-details', circleId],
    queryFn: async () => {
      if (!circle?.members) return [];
      const response = await base44.functions.invoke('getUsersByIds', { userIds: circle.members });
      const users = response.data?.users || [];
      return users.slice(0, 4);
    },
    enabled: !!circle?.members
  });

  // Fetch associated signal
  const { data: signal } = useQuery({
    queryKey: ['signal', circle?.signal_id],
    queryFn: async () => {
      if (!circle?.signal_id) return null;
      const signals = await base44.entities.Signal.list('-created_date', 100);
      return signals.find(s => s.id === circle.signal_id);
    },
    enabled: !!circle?.signal_id
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['circle-messages', circleId],
    queryFn: async () => {
      const allMessages = await base44.entities.CircleMessage.list('created_date', 200);
      return allMessages.filter(m => m.circle_id === circleId);
    },
    enabled: !!circleId,
    refetchInterval: 3000 // Poll every 3 seconds
  });

  // Get pinned messages for banner
  const pinnedMessages = messages.filter(msg => msg.pinned && msg.type === 'burn').reverse();

  // Fetch typing statuses
  const { data: typingStatuses = [] } = useQuery({
    queryKey: ['typing-status', circleId],
    queryFn: async () => {
      const now = new Date();
      const statuses = await base44.entities.TypingStatus.list('-updated_date', 50);
      // Filter out expired statuses and not this user
      return statuses.filter((s) =>
        s.circle_id === circleId &&
        s.is_typing === true &&
        new Date(s.expires_at) > now && 
        s.user_id !== user?.id
      );
    },
    enabled: !!circleId && !!user?.id,
    refetchInterval: 2000
  });

  const typingUsers = typingStatuses.map((s) => s.user_name);



  // React to message mutation
  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }) => {
      const allMessages = await base44.entities.CircleMessage.list('-created_date', 200);
      const msg = allMessages.find(m => m.id === messageId);
      if (!msg) return;

      const reactions = msg.reactions || {};
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      const userIndex = reactions[emoji].indexOf(user.id);
      if (userIndex > -1) {
        reactions[emoji].splice(userIndex, 1);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].push(user.id);
      }

      return base44.entities.CircleMessage.update(messageId, { reactions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle-messages', circleId]);
    }
  });

  // Edit message mutation
  const editMutation = useMutation({
    mutationFn: async ({ messageId, content }) => {
      return base44.entities.CircleMessage.update(messageId, {
        content,
        edited: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle-messages', circleId]);
      setEditingMessage(null);
      setMessage('');
    }
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId) => {
      return base44.entities.CircleMessage.delete(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle-messages', circleId]);
    }
  });

  // Pin message mutation
  const pinMutation = useMutation({
    mutationFn: async (message) => {
      return base44.entities.CircleMessage.update(message.id, {
        pinned: !message.pinned
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle-messages', circleId]);
    }
  });

  // Save message mutation
  const saveMutation = useMutation({
    mutationFn: async (message) => {
      return base44.entities.CircleMessage.update(message.id, {
        saved: !message.saved
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['circle-messages', circleId]);
    }
  });

  // Check if user needs to set quest
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();

  const { data: myQuest } = useQuery({
    queryKey: ['my-quest-check', circleId, user?.id, month, year],
    queryFn: async () => {
      if (!user?.id) return null;
      const quests = await base44.entities.MonthlyQuest.list('-created_date', 100);
      return quests.find(q => 
        q.circle_id === circleId && 
        q.user_id === user.id && 
        q.month === month && 
        q.year === year
      ) || null;
    },
    enabled: !!circleId && !!user?.id && !circle?.signal_id
  });

  // Track if we've checked for quest (prevent re-prompt on refresh)
  const hasCheckedQuest = useRef(false);
  useEffect(() => {
    if (!circle?.signal_id && user?.id && myQuest === null && !hasCheckedQuest.current) {
      setShowSetQuest(true);
      hasCheckedQuest.current = true;
    }
  }, [myQuest, user?.id, circle?.signal_id]);

  // Nudge slackers on day 3
  useEffect(() => {
    const sendNudge = async () => {
      if (!circle?.signal_id && day === 3 && !myQuest && user?.id) {
        const allMessages = await base44.entities.CircleMessage.list('-created_date', 50);
        const existingNudges = allMessages.filter(m =>
          m.circle_id === circleId &&
          m.sender_id === 'bot' &&
          m.type === 'system'
        );

        const alreadyNudged = existingNudges.some((m) =>
        m.content.includes(user.full_name) &&
        m.content.includes('set your quest')
        );

        if (!alreadyNudged) {
          await base44.entities.CircleMessage.create({
            circle_id: circleId,
            sender_id: 'bot',
            sender_name: 'Quest Bot',
            content: `⚠️ @${user.full_name} - Don't forget to set your quest for ${format(now, 'MMMM')}!`,
            type: 'system'
          });
        }
      }
    };
    sendNudge();
  }, [day, myQuest, user?.id, circle?.signal_id, circleId, user?.full_name, now]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ content, imageUrl, mentions }) => {
      const newMessage = await base44.entities.CircleMessage.create({
        circle_id: circleId,
        sender_id: user.id,
        sender_name: user.full_name,
        content: imageUrl || content,
        type: imageUrl ? 'image' : burnMode ? 'burn' : 'text',
        reply_to: replyingTo?.id,
        mentions: mentions || [],
        read_by: [user.id]
      });

      // Send notifications
      try {
        await base44.functions.invoke('sendMessageNotification', {
          circleId,
          messageId: newMessage.id,
          mentions: mentions || []
        });
      } catch (error) {
        console.error('Failed to send notifications:', error);
      }

      return newMessage;
    },
    onSuccess: () => {
      setMessage('');
      setImagePreview(null);
      setReplyingTo(null);
      setMentions([]);
      setIsTyping(false);
      queryClient.invalidateQueries(['circle-messages', circleId]);
    }
  });

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImagePreview(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  // Mark messages as read when visible
  useEffect(() => {
    if (!user?.id || messages.length === 0) return;

    const markAsRead = async () => {
      const unreadMessages = messages.filter((msg) =>
      !msg.read_by?.includes(user.id) && msg.sender_id !== user.id
      );

      for (const msg of unreadMessages) {
        try {
          const updatedReadBy = [...(msg.read_by || []), user.id];
          await base44.entities.CircleMessage.update(msg.id, {
            read_by: updatedReadBy
          });
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      }
    };

    markAsRead();
  }, [messages, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Measure header height
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [circle?.music_link]);

  // Update typing status
  const updateTypingStatus = async (typing) => {
    if (!user?.id || !circleId) return;

    try {
      if (typing) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 5);

        const existingStatuses = await base44.entities.TypingStatus.filter({
          circle_id: circleId,
          user_id: user.id
        }, '-created_date', 1);

        if (existingStatuses.length > 0) {
          await base44.entities.TypingStatus.update(existingStatuses[0].id, {
            is_typing: true,
            expires_at: expiresAt.toISOString()
          });
        } else {
          await base44.entities.TypingStatus.create({
            circle_id: circleId,
            user_id: user.id,
            user_name: user.full_name,
            is_typing: true,
            expires_at: expiresAt.toISOString()
          });
        }
      } else {
        const allStatuses = await base44.entities.TypingStatus.list('-created_date', 100);
        const existingStatuses = allStatuses.filter(s =>
          s.circle_id === circleId && s.user_id === user.id
        );

        if (existingStatuses.length > 0) {
          await base44.entities.TypingStatus.update(existingStatuses[0].id, {
            is_typing: false
          });
        }
      }
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 3000);
  };

  const handleSend = () => {
    if (editingMessage) {
      editMutation.mutate({
        messageId: editingMessage.id,
        content: message.trim()
      });
    } else if (imagePreview) {
      sendMutation.mutate({ imageUrl: imagePreview, mentions });
    } else if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate({ content: message.trim(), mentions });
    }
    updateTypingStatus(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isExpired = circle?.expires_at && isAfter(new Date(), new Date(circle.expires_at));
  const isSyndicate = signal?.type === 'syndicate';

  if (!circle) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full" />

      </div>);

  }

  // Convert hex to RGB for transparency control
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 210, 255';
  };

  const accentColor = circle?.accent_color || '#8F00FF';
  const accentRgb = hexToRgb(accentColor);

  const themeStyles = {
    '--nova-accent': accentColor,
    '--nova-accent-rgb': accentRgb,
    '--nova-accent-glow': `${accentColor}33`,
  };

  return (
    <div className="bg-black h-screen relative overflow-hidden" style={{ height: '100vh', ...themeStyles }}>
      <style>{`
        html, body, #root {
          height: 100vh;
          overflow: hidden;
          overscroll-behavior: none;
        }
      `}</style>

      {/* Header - Fixed Top */}
      <div ref={headerRef} className="absolute top-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-white/5 z-[50] pt-safe">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => navigate(createPageUrl('Circles'))}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">

              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
            
            <button
              onClick={() => setShowMemberDrawer(true)}
              className="flex-1 text-left">

              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white truncate">{circle.name}</h1>
                {circle.signal_id ?
                <Badge
                  className={`${
                  isSyndicate ?
                  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                  'bg-amber-500/20 text-amber-400 border-amber-500/30'} border text-xs flex-shrink-0`
                  }>

                    {isSyndicate ? <Zap className="w-2.5 h-2.5 mr-1" /> : <Moon className="w-2.5 h-2.5 mr-1" />}
                    {isSyndicate ? 'SYN' : 'UNW'}
                  </Badge> :

                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 border text-xs flex-shrink-0">
                    <Users className="w-2.5 h-2.5 mr-1" />
                    GROUP
                  </Badge>
                }
              </div>
              
              {/* Member Avatars */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex -space-x-2">
                  {memberDetails.map((member, idx) =>
                  <div
                    key={member.id}
                    className="w-6 h-6 rounded-full border-2 border-black overflow-hidden"
                    style={{ zIndex: 4 - idx }}>
                      {member.profile_picture ? (
                        <img 
                          src={member.profile_picture} 
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold">
                          {member.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-white/40 text-xs">
                  {circle.members?.length || 0} members
                </span>
                {circle.signal_id && circle.expires_at &&
                <>
                    <span className="text-white/20 text-xs">•</span>
                    <span className="text-white/40 text-xs">
                      {isExpired ? 'Archived' : `Expires ${formatDistanceToNow(new Date(circle.expires_at), { addSuffix: true })}`}
                    </span>
                  </>
                }
              </div>
            </button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <MoreVertical className="w-5 h-5 text-white/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white z-[100000]">
              {!circle.signal_id &&
              <DropdownMenuItem
                onClick={() => setShowSettings(true)}
                className="hover:bg-white/10 cursor-pointer">

                  <Settings className="w-4 h-4 mr-2" />
                  Group Settings
                </DropdownMenuItem>
              }
              <DropdownMenuItem
                onClick={() => setShowMemberDrawer(true)}
                className="hover:bg-white/10 cursor-pointer">

                <Users className="w-4 h-4 mr-2" />
                View Members
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowGallery(true)}
                className="hover:bg-white/10 cursor-pointer">

                <Camera className="w-4 h-4 mr-2" />
                Memories
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Music Link Header */}
        {circle.music_link &&
        <a
          href={circle.music_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 mx-4 mb-4 bg-green-500/10 border border-green-500/20 rounded-xl p-3 hover:border-green-500/40 transition-colors">

            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-green-400 text-sm font-medium">Join Shared Session</p>
              <p className="text-white/40 text-xs truncate">Sync with the group's playlist</p>
            </div>
            <ExternalLink className="w-4 h-4 text-green-400 flex-shrink-0" />
          </a>
        }
      </div>
      
      {/* Tabs Header - Only for Friends Groupchats */}
      {!circle.signal_id &&
      <CircleTabsHeader
        circle={circle}
        currentUserId={user?.id}
        circleId={circleId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFeedModalChange={setIsPostModalOpen}
        dynamicTop={headerHeight}
        pinnedMessages={pinnedMessages}
        onUnpinMessage={(msg) => pinMutation.mutate(msg)}
        onJumpToMessage={(msg) => {
          const element = document.getElementById(`msg-${msg.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }} />

      }

      {/* Messages Area - Absolute Positioned */}
      <div
        className="absolute left-0 right-0 overflow-y-auto px-4 py-4 flex flex-col-reverse"
        style={{
          top: !circle.signal_id ? `calc(${headerHeight}px + 60px)` : `${headerHeight}px`,
          bottom: '132px',
          WebkitOverflowScrolling: 'touch',
          background: burnMode ? 'linear-gradient(to bottom, rgba(109, 40, 217, 0.3) 0%, rgba(88, 28, 135, 0.15) 30%, rgba(0, 0, 0, 0) 60%)' : 'transparent'
        }}>


        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isOwn = msg.sender_id === user?.id;
              const isSystem = msg.type === 'system';
              const isChallengeProof = msg.type === 'challenge_proof';
              const isBurnMsg = msg.type === 'burn';

              // Filter messages based on mode (only for friend groups with tabs)
              if (!circle.signal_id) {
                if (burnMode && !isBurnMsg) return null;
                if (!burnMode && isBurnMsg) return null;

                // Hide regular messages when feed tab is active
                if (feedMode && !isSystem && msg.type === 'text') return null;
              }

                          // Show context menu for text messages (event chats) and burn messages
                          const showContextMenu = msg.type === 'text' || msg.type === 'burn';

              // Find reply-to message
              const replyToMessage = msg.reply_to ?
              messages.find((m) => m.id === msg.reply_to) :
              null;

              if (isSystem) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, type: 'spring', stiffness: 300, damping: 30 }}
                    className="text-center">

                  <span className="text-white/30 text-xs bg-white/5 backdrop-blur-xl px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </motion.div>);

              }

              if (isChallengeProof) {
                const isVideo = msg.content.includes('.mp4') || msg.content.includes('.mov') || msg.content.includes('video');

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, type: 'spring', stiffness: 300, damping: 30 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex justify-center">

                  <div className="bg-white/5 backdrop-blur-xl border-2 border-amber-500/40 rounded-2xl p-3 max-w-xs shadow-[inset_0_0_15px_rgba(251,146,60,0.1)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400 text-xs font-bold uppercase">Challenge Complete</span>
                    </div>
                    {isVideo ?
                      <video
                        src={msg.content}
                        controls
                        className="w-full rounded-xl mb-2 bg-black" /> :


                      <img
                        src={msg.content}
                        alt="Challenge proof"
                        className="w-full rounded-xl mb-2 cursor-pointer"
                        onClick={() => window.open(msg.content, '_blank')} />

                      }
                    <p className="text-white text-sm font-medium">{msg.sender_name}</p>
                    <p className="text-white/40 text-xs">{format(new Date(msg.created_date), 'h:mm a')}</p>
                  </div>
                </motion.div>);

              }

              const isLatestMessage = index === messages.length - 1;
              return (
                <div key={msg.id} id={`msg-${msg.id}`}>
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    currentUserId={user?.id}
                    onReact={(messageId, emoji) => reactMutation.mutate({ messageId, emoji })}
                    onReply={(message) => setReplyingTo(message)}
                    onEdit={(message) => {
                      setEditingMessage(message);
                      setMessage(message.content);
                    }}
                    onDelete={(message) => deleteMutation.mutate(message.id)}
                    onPin={(message) => pinMutation.mutate(message)}
                    onSave={(message) => saveMutation.mutate(message)}
                    replyToMessage={replyToMessage}
                    allMembers={memberDetails}
                    isLatestMessage={isLatestMessage}
                    onClickSender={(senderId) => setSelectedUserId(senderId)} />
                </div>);


            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          <TypingIndicator typingUsers={typingUsers} />

          <div ref={messagesEndRef} />
          </div>
          </div>
      
      {/* Footer - Absolute Bottom Stack */}
      {(!feedMode || circle?.signal_id) && !isPostModalOpen &&
      <div className="absolute left-0 right-0 flex flex-col z-[2000]" style={{ bottom: '72px' }}>
          {/* Message Input */}
          {!isExpired ?
        <div className="mb-2 px-3 py-3 bg-white/[0.03] backdrop-blur-xl border-t border-white/10">
          {/* Reply Preview */}
          {replyingTo &&
          <div className="mb-2 p-2 bg-violet-500/10 rounded-lg flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-violet-400 text-xs">Replying to {replyingTo.sender_name}</p>
                <p className="text-white/60 text-xs truncate">{replyingTo.content}</p>
              </div>
              <button
              onClick={() => setReplyingTo(null)}
              className="text-white/40 hover:text-white">

                <X className="w-4 h-4" />
              </button>
            </div>
          }

          {/* Edit Preview */}
          {editingMessage &&
          <div className="mb-2 p-2 bg-amber-500/10 rounded-lg flex items-center justify-between">
              <p className="text-amber-400 text-xs">Editing message</p>
              <button
              onClick={() => {
                setEditingMessage(null);
                setMessage('');
              }}
              className="text-white/40 hover:text-white">

                <X className="w-4 h-4" />
              </button>
            </div>
          }

          {/* Image Preview */}
          {imagePreview &&
          <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
              <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">

                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          }
          
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/quicktime"
              onChange={handleImageUpload}
              className="hidden" />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              variant="ghost"
              className="w-10 h-10 rounded-full bg-zinc-900/50 hover:bg-zinc-800 p-0 flex-shrink-0">

              {uploadingImage ?
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> :


              <Camera className="w-4 h-4 text-purple-400" />
              }
            </Button>
            <MentionInput
              value={message}
              onChange={(newValue) => {
                setMessage(newValue);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              onMentionsChange={setMentions}
              members={memberDetails}
              placeholder="Message..."
              disabled={!!imagePreview}
              className="flex-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 text-white placeholder:text-white/30 h-10 rounded-full px-4 text-sm transition-all duration-300 focus:border-[var(--nova-accent)] focus:shadow-[0_0_20px_var(--nova-accent-glow)]" />

            <Button
              onMouseDown={(e) => {
                e.preventDefault();
                handleSend();
              }}
              disabled={!message.trim() && !imagePreview || sendMutation.isPending}
              className="w-10 h-10 rounded-full p-0 flex-shrink-0 nova-glow-active"
              style={{
                backgroundColor: 'var(--nova-accent)'
              }}>

              <Send className="w-4 h-4" />
            </Button>
            </div>
            </div> :

        <div className="bg-zinc-900/95 backdrop-blur-xl border-t border-white/5 py-3 text-center">
            <p className="text-white/40 text-sm">This circle has been archived</p>
            </div>
        }
            </div>
      }

      {/* Member List Drawer */}
      <MemberListDrawer
        isOpen={showMemberDrawer}
        onClose={() => setShowMemberDrawer(false)}
        circle={circle}
        currentUserId={user?.id}
        onMemberClick={(userId) => setSelectedUserId(userId)} />

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}


      {/* Memory Gallery */}
      <MemoryGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        circleId={circleId} />


      {/* Group Settings */}
      <GroupSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        circle={circle}
        currentUserId={user?.id} />


      {/* Set Quest Modal */}
      {!circle?.signal_id &&
      <SetQuestModal
        isOpen={showSetQuest}
        onClose={() => setShowSetQuest(false)}
        circleId={circleId}
        userId={user?.id} />

      }
      </div>);

}