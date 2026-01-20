import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Clock, MapPin, Users, Star, Music, ExternalLink,
  Zap, Moon, Check, X, UserPlus, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { addHours } from 'date-fns';
import UserProfileModal from '@/components/profile/UserProfileModal';

export default function SignalDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showHostProfile, setShowHostProfile] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const signalId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Fetch signal
  const { data: signal } = useQuery({
    queryKey: ['signal', signalId],
    queryFn: async () => {
      const signals = await base44.entities.Signal.filter({ id: signalId }, '-created_date', 1);
      return signals[0];
    },
    enabled: !!signalId,
  });

  // Fetch requests for this signal
  const { data: requests = [] } = useQuery({
    queryKey: ['signal-requests', signalId],
    queryFn: async () => {
      return base44.entities.SignalRequest.filter({ signal_id: signalId }, '-created_date', 50);
    },
    enabled: !!signalId,
  });

  // Check if user already requested
  const userRequest = requests.find(r => r.user_id === user?.id);
  const isHost = signal?.host_id === user?.id;
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');

  // Request to join mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      // Check if already requested
      const existing = await base44.entities.SignalRequest.filter({
        signal_id: signalId,
        user_id: user.id,
      }, '-created_date', 1);
      
      if (existing.length > 0) {
        throw new Error('Already requested');
      }
      
      return base44.entities.SignalRequest.create({
        signal_id: signalId,
        user_id: user.id,
        user_name: user.full_name,
        user_reliability: user.reliability_score || 3,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['signal-requests', signalId]);
    },
    onError: (error) => {
      alert(error.message || 'Failed to request');
    },
  });

  // Approve/Reject mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }) => {
      await base44.entities.SignalRequest.update(requestId, { status });
      
      // If approved, create/update circle
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        const existingCircles = await base44.entities.Circle.filter({ signal_id: signalId }, '-created_date', 1);
        
        if (existingCircles.length > 0) {
          // Add to existing circle
          const circle = existingCircles[0];
          const newMembers = [...(circle.members || []), request.user_id];
          await base44.entities.Circle.update(circle.id, { members: newMembers });
        } else {
          // Create new circle
          const eventTime = new Date(signal.event_time);
          const expiresAt = addHours(eventTime, 48);
          
          await base44.entities.Circle.create({
            signal_id: signalId,
            name: signal.title,
            members: [signal.host_id, request.user_id],
            music_link: signal.music_link,
            expires_at: expiresAt.toISOString(),
            status: 'active',
          });
        }
        
        // Update participant count
        await base44.entities.Signal.update(signalId, {
          current_participants: (signal.current_participants || 0) + 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['signal-requests', signalId]);
      queryClient.invalidateQueries(['signal', signalId]);
    },
  });

  // Check-in mutation (host confirms attendance)
  const checkInMutation = useMutation({
    mutationFn: async (requestId) => {
      return base44.entities.SignalRequest.update(requestId, { checked_in: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['signal-requests', signalId]);
    },
  });

  if (!signal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    );
  }

  const isSyndicate = signal.type === 'syndicate';
  
  const vibeColors = {
    intense: 'bg-red-500/20 text-red-400',
    balanced: 'bg-violet-500/20 text-violet-400',
    chill: 'bg-cyan-500/20 text-cyan-400',
    social: 'bg-amber-500/20 text-amber-400',
  };

  const activityLabels = {
    running: 'Running',
    calisthenics: 'Calisthenics',
    hiit: 'HIIT',
    cycling: 'Cycling',
    yoga: 'Yoga',
    meditation: 'Meditation',
    sauna: 'Sauna',
    stretching: 'Stretching',
    swimming: 'Swimming',
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Image */}
      <div className="relative h-72">
        {signal.image_url ? (
          <img 
            src={signal.image_url}
            alt={signal.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-cyan-600/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>
      
      {/* Content */}
      <div className="px-4 -mt-20 relative z-10">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge 
            className={`${
              isSyndicate 
                ? 'bg-cyan-500/80 text-black' 
                : 'bg-amber-500/80 text-black'
            } font-semibold`}
          >
            {isSyndicate ? <Zap className="w-3 h-3 mr-1" /> : <Moon className="w-3 h-3 mr-1" />}
            {isSyndicate ? 'SYNDICATE' : 'UNWIND'}
          </Badge>
          {signal.vibe && (
            <Badge className={`${vibeColors[signal.vibe]} border border-white/10`}>
              {signal.vibe.toUpperCase()}
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">{signal.title}</h1>
        <p className="text-white/50 mb-6">{activityLabels[signal.activity] || signal.activity}</p>
        
        {/* Host */}
        <button
          onClick={() => setShowHostProfile(true)}
          className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-lg font-bold">
            {signal.host_name?.charAt(0) || 'H'}
          </div>
          <div className="text-left">
            <p className="text-white font-medium">{signal.host_name || 'Anonymous Host'}</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${
                    i < (signal.host_reliability || 0) 
                      ? 'text-amber-400 fill-amber-400' 
                      : 'text-white/20'
                  }`} 
                />
              ))}
              <span className="text-white/40 text-xs ml-1">Reliability</span>
            </div>
          </div>
        </button>
        
        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <p className="text-white font-medium">
              {signal.event_time ? format(new Date(signal.event_time), 'h:mm a') : '--:--'}
            </p>
            <p className="text-white/40 text-xs">
              {signal.event_time ? format(new Date(signal.event_time), 'MMM d') : ''}
            </p>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
            <MapPin className="w-5 h-5 text-violet-400 mx-auto mb-2" />
            <p className="text-white font-medium truncate text-sm">
              {signal.location_name || 'TBD'}
            </p>
            <p className="text-white/40 text-xs">{signal.duration_minutes || 60} min</p>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-white font-medium">
              {signal.current_participants || 0}/{signal.max_participants || '∞'}
            </p>
            <p className="text-white/40 text-xs">Spots</p>
          </div>
        </div>
        
        {/* Description */}
        {signal.description && (
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-6">
            <p className="text-white/70">{signal.description}</p>
          </div>
        )}
        
        {/* Music Link */}
        {signal.music_link && (
          <a
            href={signal.music_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4 mb-6 hover:border-green-500/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <Music className="w-6 h-6 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">Session Playlist</p>
              <p className="text-white/40 text-sm truncate">Tap to preview the vibe</p>
            </div>
            <ExternalLink className="w-5 h-5 text-green-400" />
          </a>
        )}
        
        {/* Host Section - Manage Requests */}
        {isHost && pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Pending Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div 
                  key={req.id}
                  className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                      {req.user_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{req.user_name}</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-2.5 h-2.5 ${
                              i < (req.user_reliability || 0) 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-white/20'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: 'rejected' })}
                      className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: 'approved' })}
                      className="w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400"
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Approved Members */}
        {approvedRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Confirmed ({approvedRequests.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {approvedRequests.map((req) => (
                <div 
                  key={req.id}
                  className="bg-zinc-900/50 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                    {req.user_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-white text-sm">{req.user_name}</span>
                  {req.checked_in && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <div className="pb-8">
          {isHost ? (
            <div className="text-center text-white/40 py-4">
              You're hosting this signal
            </div>
          ) : userRequest ? (
            <div className={`text-center py-4 rounded-xl ${
              userRequest.status === 'pending' 
                ? 'bg-amber-500/10 text-amber-400'
                : userRequest.status === 'approved'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
            }`}>
              {userRequest.status === 'pending' && 'Request Pending...'}
              {userRequest.status === 'approved' && 'You\'re In! Check your Circles.'}
              {userRequest.status === 'rejected' && 'Request Not Approved'}
            </div>
          ) : (
            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="w-full h-14 nova-gradient nova-glow-violet text-white font-semibold text-lg rounded-xl"
            >
              {joinMutation.isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'Request to Join'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Host Profile Modal */}
      {showHostProfile && signal.host_id && (
        <UserProfileModal userId={signal.host_id} onClose={() => setShowHostProfile(false)} />
      )}
    </div>
  );
}