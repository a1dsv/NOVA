import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, Star, Trophy, Flame, Activity, Heart, Clock, 
  Music, ExternalLink, Settings, LogOut, ChevronRight,
  Zap, Shield, Crown, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function Vault() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const tribeRankConfig = {
    initiate: { 
      label: 'Initiate', 
      icon: Shield, 
      color: 'text-zinc-400',
      gradient: 'from-zinc-500 to-zinc-600',
      next: 'member',
      threshold: 0
    },
    member: { 
      label: 'Member', 
      icon: Award, 
      color: 'text-violet-400',
      gradient: 'from-violet-500 to-violet-600',
      next: 'elite',
      threshold: 10
    },
    elite: { 
      label: 'Elite', 
      icon: Crown, 
      color: 'text-cyan-400',
      gradient: 'from-cyan-500 to-cyan-600',
      next: 'legend',
      threshold: 25
    },
    legend: { 
      label: 'Legend', 
      icon: Zap, 
      color: 'text-amber-400',
      gradient: 'from-amber-500 to-amber-600',
      next: null,
      threshold: 50
    },
  };

  const currentRank = tribeRankConfig[user?.tribe_rank || 'initiate'];
  const RankIcon = currentRank.icon;

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  if (!user) {
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

  return (
    <div className="min-h-screen bg-black pb-8">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-black to-cyan-600/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        
        {/* Settings */}
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/60 hover:text-white z-10">
          <Settings className="w-5 h-5" />
        </button>
      </div>
      
      {/* Profile Section */}
      <div className="px-4 -mt-20 relative z-10">
        {/* Avatar */}
        <div className="flex items-end gap-4 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-3xl font-bold ring-4 ring-black">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                user.full_name?.charAt(0) || 'N'
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-gradient-to-br ${currentRank.gradient} flex items-center justify-center ring-2 ring-black`}>
              <RankIcon className="w-4 h-4 text-black" />
            </div>
          </div>
          
          <div className="flex-1 pb-2">
            <h1 className="text-xl font-bold text-white">{user.full_name || 'Anonymous'}</h1>
            <p className="text-white/40 text-sm">{user.email}</p>
            <Badge className={`mt-2 ${currentRank.color} bg-white/5 border border-white/10`}>
              {currentRank.label}
            </Badge>
          </div>
        </div>
        
        {/* Bio */}
        {user.bio && (
          <p className="text-white/60 text-sm mb-6">{user.bio}</p>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center"
          >
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{user.events_attended || 0}</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Attended</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${
                    i < (user.reliability_score || 3) 
                      ? 'text-amber-400 fill-amber-400' 
                      : 'text-white/20'
                  }`} 
                />
              ))}
            </div>
            <p className="text-2xl font-bold text-white">{user.reliability_score || '3.0'}</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Reliability</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center"
          >
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{user.consistency_streak || 0}</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Streak</p>
          </motion.div>
        </div>
        
        {/* Biometric Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-white/10 rounded-2xl p-5 mb-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Biometric Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Recovery</span>
                <span className="text-white font-bold">{user.recovery_percentage || 85}%</span>
              </div>
              <Progress 
                value={user.recovery_percentage || 85} 
                className="h-2 bg-white/10"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Weekly Activity</span>
                <span className="text-white font-bold">{user.weekly_activity_minutes || 320} min</span>
              </div>
              <Progress 
                value={Math.min(((user.weekly_activity_minutes || 320) / 500) * 100, 100)} 
                className="h-2 bg-white/10"
              />
            </div>
          </div>
          
          <p className="text-white/40 text-xs mt-4 flex items-center gap-1">
            <Heart className="w-3 h-3" />
            Connect your wearable to sync real data
          </p>
        </motion.div>
        
        {/* Previous Playlists */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-green-400" />
            Digital Mementos
          </h3>
          
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {(user.previous_playlists && user.previous_playlists.length > 0) ? (
              user.previous_playlists.map((playlist, index) => (
                <a
                  key={index}
                  href={playlist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-40 bg-zinc-900/50 border border-white/5 rounded-xl p-3 hover:border-green-500/30 transition-all group"
                >
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mb-2">
                    <Music className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-white text-sm font-medium truncate">{playlist.title}</p>
                  <p className="text-white/40 text-xs">{playlist.event_date}</p>
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-green-400 mt-2 transition-colors" />
                </a>
              ))
            ) : (
              <div className="flex-shrink-0 w-full text-center py-8 text-white/40">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No playlists yet</p>
                <p className="text-xs text-white/20">Join events to collect mementos</p>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-2"
        >
          <button className="w-full flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="text-white">Connect Wearable</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/20" />
          </button>
          
          <button className="w-full flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-white/60" />
              <span className="text-white">Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/20" />
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl p-4 hover:bg-red-500/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400">Log Out</span>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}