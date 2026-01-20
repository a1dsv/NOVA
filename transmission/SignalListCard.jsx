import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Users, Star, Zap, Moon, ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import UserProfileModal from '@/components/profile/UserProfileModal';

export default function SignalListCard({ signal, onClick, index }) {
  const [user, setUser] = useState(null);
  const [hostUser, setHostUser] = useState(null);
  const [showHostProfile, setShowHostProfile] = useState(false);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadHostUser = async () => {
      if (signal.host_id) {
        const response = await base44.functions.invoke('getUsersByIds', { userIds: [signal.host_id] });
        const users = response.data?.users || [];
        if (users.length > 0) {
          setHostUser(users[0]);
        }
      }
    };
    loadHostUser();
  }, [signal.host_id]);

  const { data: userRequest } = useQuery({
    queryKey: ['signal-request', signal.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const requests = await base44.entities.SignalRequest.filter({
        signal_id: signal.id,
        user_id: user.id,
      }, '-created_date', 1);
      return requests[0] || null;
    },
    enabled: !!user && !!signal.id,
  });

  const joinMutation = useMutation({
    mutationFn: async (e) => {
      e.stopPropagation();
      const existing = await base44.entities.SignalRequest.filter({
        signal_id: signal.id,
        user_id: user.id,
      }, '-created_date', 1);
      
      if (existing.length > 0) {
        throw new Error('Already requested');
      }
      
      return base44.entities.SignalRequest.create({
        signal_id: signal.id,
        user_id: user.id,
        user_name: user.full_name,
        user_reliability: user.reliability_score || 3,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['signal-request', signal.id]);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const isSyndicate = signal.type === 'syndicate';
  const isHost = signal.host_id === user?.id;
  
  const vibeColors = {
    intense: 'from-red-500/20 to-orange-500/20',
    balanced: 'from-violet-500/20 to-pink-500/20',
    chill: 'from-cyan-500/20 to-blue-500/20',
    social: 'from-amber-500/20 to-yellow-500/20',
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
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all group">
        {/* Image Header */}
        <div className="relative h-44 overflow-hidden">
          {signal.image_url ? (
            <img 
              src={signal.image_url}
              alt={signal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${vibeColors[signal.vibe] || 'from-violet-500/20 to-cyan-500/20'}`} />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
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
          </div>
          
          {/* Time Badge */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
              {signal.event_time && formatDistanceToNow(new Date(signal.event_time), { addSuffix: true })}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Title & Activity */}
          <h3 className="text-lg font-bold text-white mb-1 group-hover:nova-gradient-text transition-all">
            {signal.title}
          </h3>
          <p className="text-white/50 text-sm mb-3">
            {activityLabels[signal.activity] || signal.activity}
          </p>
          
          {/* Host Row */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHostProfile(true);
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {hostUser?.profile_picture ? (
                  <img 
                    src={hostUser.profile_picture} 
                    alt={signal.host_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                    {signal.host_name?.charAt(0) || 'H'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{signal.host_name || 'Anonymous'}</p>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-2.5 h-2.5 ${
                        i < (signal.host_reliability || 0) 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-white/20'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </button>
            
            {/* Participants */}
            <div className="flex items-center gap-1 text-white/40">
              <Users className="w-4 h-4" />
              <span className="text-sm">{signal.current_participants || 0}/{signal.max_participants || '∞'}</span>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-4 text-white/40 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {signal.event_time && format(new Date(signal.event_time), 'h:mm a')}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[80px]">{signal.location_name || 'TBD'}</span>
              </div>
            </div>
            
            {/* Request Button or Status */}
            <div className="flex items-center gap-2">
              {user && (
                isHost ? (
                  <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 border text-xs">
                    Host
                  </Badge>
                ) : userRequest ? (
                  <Badge className={`${
                    userRequest.status === 'pending' 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : userRequest.status === 'approved'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                  } border text-xs`}>
                    {userRequest.status === 'pending' && 'Pending'}
                    {userRequest.status === 'approved' && <><Check className="w-3 h-3 mr-1 inline" />In</>}
                    {userRequest.status === 'rejected' && 'No'}
                  </Badge>
                ) : (
                  <Button
                    onClick={(e) => joinMutation.mutate(e)}
                    disabled={joinMutation.isPending}
                    size="sm"
                    className="nova-gradient text-xs h-7 px-3"
                  >
                    Request
                  </Button>
                )
              )}
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Host Profile Modal */}
      {showHostProfile && signal.host_id && (
        <UserProfileModal userId={signal.host_id} onClose={() => setShowHostProfile(false)} />
      )}
    </motion.button>
  );
}