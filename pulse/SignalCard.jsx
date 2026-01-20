import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Clock, Users, Calendar, Music, Zap, Moon, Award, Star, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UserProfileModal from '@/components/profile/UserProfileModal';

export default function SignalCard({ signal, onClose, onRequestJoin, isRequesting }) {
  const [showHostProfile, setShowHostProfile] = useState(false);

  const { data: hostUser } = useQuery({
    queryKey: ['signal-host', signal.host_id],
    queryFn: async () => {
      const response = await base44.functions.invoke('getUsersByIds', { userIds: [signal.host_id] });
      const users = response.data?.users || [];
      return users[0];
    },
    enabled: !!signal.host_id
  });

  const { data: currentUserRequest } = useQuery({
    queryKey: ['my-signal-request', signal.id],
    queryFn: async () => {
      const user = await base44.auth.me();
      const requests = await base44.entities.SignalRequest.filter({
        signal_id: signal.id,
        user_id: user.id
      });
      return requests[0];
    }
  });

  const isSyndicate = signal.type === 'syndicate';
  const signalColor = isSyndicate ? 'cyan' : 'amber';
  const signalIcon = isSyndicate ? Zap : Moon;
  const SignalIcon = signalIcon;

  const getTrustBadge = () => {
    if (!hostUser) return null;
    const stars = hostUser.trust_stars || 3;
    const cautionCount = hostUser.caution_count || 0;

    if (cautionCount > 0) {
      return (
        <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-2 py-1">
          <ShieldAlert className="w-3 h-3 text-yellow-400" />
          <span className="text-yellow-400 text-xs font-medium">Caution</span>
        </div>);

    }

    if (stars >= 4) {
      return (
        <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1">
          <ShieldCheck className="w-3 h-3 text-green-400" />
          <span className="text-green-400 text-xs font-medium">Trusted</span>
        </div>);

    }

    return null;
  };

  return (
    <>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[1001] bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-hidden max-h-[85vh]">

        <div className="overflow-y-auto max-h-[85vh] pb-24">
          {/* Header */}
          <div className="bg-zinc-900/95 px-6 py-6 sticky top-0 z-10 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center justify-between">
              <Badge className={`bg-${signalColor}-500/20 text-${signalColor}-400 border-${signalColor}-500/30`}>
                <SignalIcon className="w-3 h-3 mr-1" />
                {signal.type === 'syndicate' ? 'High Energy' : 'Recovery'}
              </Badge>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">

                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            {/* Title & Description */}
            <h2 className="text-white font-bold text-2xl mb-2">{signal.title}</h2>
            {signal.description &&
            <p className="text-white/60 text-sm mb-4">{signal.description}</p>
            }

            {/* Host Info with Trust Badge */}
            <button
              onClick={() => setShowHostProfile(true)}
              className="flex items-center gap-3 mb-4 p-3 bg-black/30 rounded-xl hover:bg-black/40 transition-colors w-full">

              {hostUser?.profile_picture ?
              <img
                src={hostUser.profile_picture}
                alt={signal.host_name}
                className="w-12 h-12 rounded-full object-cover" /> :


              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-bold">{signal.host_name?.charAt(0)}</span>
                </div>
              }
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Hosted by {signal.host_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) =>
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                      star <= (hostUser?.trust_stars || 3) ?
                      'fill-amber-400 text-amber-400' :
                      'text-gray-600'}`
                      } />

                    )}
                  </div>
                  {getTrustBadge()}
                </div>
              </div>
            </button>

            {/* Activity Badge */}
            <div className="mb-4">
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                {signal.activity}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-black/30 rounded-xl p-3">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Date & Time</span>
                </div>
                <p className="text-white text-sm font-medium">
                  {format(new Date(signal.event_time), 'MMM d, h:mm a')}
                </p>
              </div>

              <div className="bg-black/30 rounded-xl p-3">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Duration</span>
                </div>
                <p className="text-white text-sm font-medium">{signal.duration_minutes || 60} min</p>
              </div>

              <div className="bg-black/30 rounded-xl p-3">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Participants</span>
                </div>
                <p className="text-white text-sm font-medium">
                  {signal.current_participants || 0} / {signal.max_participants || '∞'}
                </p>
              </div>

              <div className="bg-black/30 rounded-xl p-3">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs">Vibe</span>
                </div>
                <p className="text-white text-sm font-medium capitalize">{signal.vibe || 'balanced'}</p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-black/30 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-white/40 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs">Location</span>
              </div>
              <p className="text-white text-sm font-medium">{signal.location_name || 'Location TBD'}</p>
            </div>

            {/* Music Link */}
            {signal.music_link &&
            <div className="bg-black/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <Music className="w-4 h-4" />
                  <span className="text-xs">Playlist</span>
                </div>
                <a
                href={signal.music_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 text-sm hover:underline">

                  Open Playlist
                </a>
              </div>
            }
          </div>
        </div>

        {/* Fixed Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-zinc-900/95 backdrop-blur-xl border-t border-white/10">
          {currentUserRequest ?
          <div className={`text-center py-3 rounded-xl ${
          currentUserRequest.status === 'approved' ?
          'bg-green-500/20 text-green-400 border border-green-500/30' :
          currentUserRequest.status === 'rejected' ?
          'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`
          }>
              <p className="font-medium">
                {currentUserRequest.status === 'approved' && '✓ Request Approved'}
                {currentUserRequest.status === 'rejected' && '✗ Request Declined'}
                {currentUserRequest.status === 'pending' && '⏳ Request Pending'}
              </p>
            </div> :

          <Button
            onClick={() => onRequestJoin(signal)}
            disabled={isRequesting}
            className="w-full nova-gradient h-14 text-base font-bold">

              {isRequesting ? 'Requesting...' : 'Request to Join'}
            </Button>
          }
        </div>
      </motion.div>

      {showHostProfile &&
      <UserProfileModal
        userId={signal.host_id}
        onClose={() => setShowHostProfile(false)} />

      }
    </>);

}