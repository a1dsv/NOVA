import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TrustRatingCard({ user, trustReviews = [] }) {
  const safeCount = user.safe_count || 0;
  const cautionCount = user.caution_count || 0;
  const totalReviews = user.trust_review_count || 0;
  const trustStars = user.trust_stars || 3;

  // Calculate trust level based on stars
  const getTrustLevel = () => {
    if (cautionCount > 0) return 'caution';
    if (trustStars >= 4.5) return 'highly-trusted';
    if (trustStars >= 3.5) return 'trusted';
    if (trustStars >= 2.5) return 'neutral';
    return 'low-trust';
  };

  const trustLevel = getTrustLevel();

  const trustLevelConfig = {
    'highly-trusted': {
      icon: ShieldCheck,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      label: 'Highly Trusted',
      description: 'Verified by community'
    },
    'trusted': {
      icon: ShieldCheck,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      label: 'Trusted',
      description: 'Positive community feedback'
    },
    'neutral': {
      icon: Shield,
      color: 'text-white/60',
      bgColor: 'bg-white/5',
      borderColor: 'border-white/10',
      label: 'Neutral',
      description: 'Standard trust level'
    },
    'caution': {
      icon: ShieldAlert,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      label: 'Exercise Caution',
      description: 'Community concerns reported'
    },
    'low-trust': {
      icon: Shield,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20',
      label: 'Building Trust',
      description: 'New or incomplete profile'
    }
  };

  const config = trustLevelConfig[trustLevel];
  const Icon = config.icon;

  // Count verified social links
  const verifiedSocialLinks = user.social_links 
    ? Object.values(user.social_links).filter(link => link).length 
    : 0;

  const hasFriends = user.friends_count > 0 || false;
  const hasProfilePicture = !!user.profile_picture;

  return (
    <div className={`border ${config.borderColor} ${config.bgColor} rounded-2xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${config.color}`}>{config.label}</h3>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= trustStars
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-white/40 text-xs">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-black/20 rounded-lg p-2 text-center">
          <ShieldCheck className="w-3 h-3 text-green-400 mx-auto mb-1" />
          <p className="text-white font-bold text-sm">{safeCount}</p>
          <p className="text-white/40 text-[10px]">Safe</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2 text-center">
          <ShieldAlert className="w-3 h-3 text-yellow-400 mx-auto mb-1" />
          <p className="text-white font-bold text-sm">{cautionCount}</p>
          <p className="text-white/40 text-[10px]">Caution</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2 text-center">
          <Users className="w-3 h-3 text-cyan-400 mx-auto mb-1" />
          <p className="text-white font-bold text-sm">{totalReviews}</p>
          <p className="text-white/40 text-[10px]">Reviews</p>
        </div>
      </div>

      {/* Profile Verification Indicators */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${hasProfilePicture ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className={hasProfilePicture ? 'text-white/60' : 'text-white/40'}>Profile Picture</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${verifiedSocialLinks > 0 ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className={verifiedSocialLinks > 0 ? 'text-white/60' : 'text-white/40'}>
            {verifiedSocialLinks} Social Link{verifiedSocialLinks !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${hasFriends ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className={hasFriends ? 'text-white/60' : 'text-white/40'}>Has Friends</span>
        </div>
      </div>

      {/* Anonymous Reviews */}
      {trustReviews.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/40 text-xs mb-2">Anonymous Community Feedback</p>
          <div className="space-y-2">
            {trustReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-black/20 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge className={`text-[10px] ${
                    review.rating_type === 'safe' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {review.rating_type === 'safe' ? 'SAFE' : 'CAUTION'}
                  </Badge>
                  <span className="text-white/40 text-[10px]">Anonymous</span>
                </div>
                {review.comment && (
                  <p className="text-white/60 text-xs line-clamp-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {cautionCount > 0 && (
        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
          <p className="text-yellow-400 text-xs font-medium">⚠️ Community concerns have been reported</p>
        </div>
      )}
    </div>
  );
}