import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck, ShieldAlert, AlertTriangle, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function LeaveTrustReviewModal({ targetUser, signal, currentUser, onClose }) {
  const [ratingType, setRatingType] = useState(null);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      // Create the anonymous trust review
      await base44.entities.TrustReview.create({
        reviewer_id: currentUser.id,
        reviewed_user_id: targetUser.id,
        reviewed_user_name: targetUser.full_name,
        signal_id: signal.id,
        rating_type: ratingType,
        comment: comment.trim(),
        verified: true,
      });

      // Update the reviewed user's trust stats
      const currentSafeCount = targetUser.safe_count || 0;
      const currentCautionCount = targetUser.caution_count || 0;
      const currentReviewCount = targetUser.trust_review_count || 0;
      const currentStars = targetUser.trust_stars || 3;

      const newSafeCount = ratingType === 'safe' ? currentSafeCount + 1 : currentSafeCount;
      const newCautionCount = ratingType === 'caution' ? currentCautionCount + 1 : currentCautionCount;
      const newReviewCount = currentReviewCount + 1;

      // Recalculate trust stars from base
      const users = await base44.entities.User.filter({ id: targetUser.id });
      const userProfile = users[0];
      
      const hasProfilePicture = userProfile?.profile_picture ? 1 : 0;
      const socialLinksCount = userProfile?.social_links 
        ? Object.values(userProfile.social_links).filter(link => link && link.trim()).length 
        : 0;
      const socialLinksBonus = Math.min(2, socialLinksCount) * 0.5;
      
      const allFriends = await base44.entities.Friend.filter({ status: 'accepted' });
      const userFriends = allFriends.filter(f => f.user_id === targetUser.id || f.friend_id === targetUser.id);
      const friendsBonus = userFriends.length >= 3 ? 1 : 0;
      
      // Calculate new stars: base 2 + bonuses - cautions
      const newStars = Math.max(1, 2 + hasProfilePicture + socialLinksBonus + friendsBonus - newCautionCount);

      await base44.entities.User.update(targetUser.id, {
        safe_count: newSafeCount,
        caution_count: newCautionCount,
        trust_review_count: newReviewCount,
        trust_stars: newStars,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile']);
      queryClient.invalidateQueries(['trust-reviews']);
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Anonymous Feedback</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-white/60 text-sm mb-4">
            You attended <span className="text-cyan-400">{signal.title}</span> with{' '}
            <span className="text-white font-medium">{targetUser.full_name}</span>. 
            How was your experience?
          </p>

          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 mb-4">
            <div className="flex gap-2">
              <EyeOff className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-violet-400 text-xs">
                Your feedback is completely anonymous. The user will never know who left this review.
              </p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-400 text-xs">
                Reviews are permanent and will appear on the user's profile. Caution flags immediately reduce their trust rating.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setRatingType('safe')}
              className={`p-4 rounded-xl border-2 transition-all ${
                ratingType === 'safe'
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-white/10 bg-black/20 hover:border-green-500/50'
              }`}
            >
              <ShieldCheck className={`w-8 h-8 mx-auto mb-2 ${
                ratingType === 'safe' ? 'text-green-400' : 'text-white/40'
              }`} />
              <p className={`font-medium text-sm ${
                ratingType === 'safe' ? 'text-green-400' : 'text-white/60'
              }`}>Safe</p>
              <p className="text-white/40 text-xs mt-1">Positive experience</p>
            </button>

            <button
              onClick={() => setRatingType('caution')}
              className={`p-4 rounded-xl border-2 transition-all ${
                ratingType === 'caution'
                  ? 'border-yellow-500 bg-yellow-500/20'
                  : 'border-white/10 bg-black/20 hover:border-yellow-500/50'
              }`}
            >
              <ShieldAlert className={`w-8 h-8 mx-auto mb-2 ${
                ratingType === 'caution' ? 'text-yellow-400' : 'text-white/40'
              }`} />
              <p className={`font-medium text-sm ${
                ratingType === 'caution' ? 'text-yellow-400' : 'text-white/60'
              }`}>Caution</p>
              <p className="text-white/40 text-xs mt-1">Had concerns</p>
            </button>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">
              Anonymous Comment (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the behavior that impacted your experience..."
              className="bg-black/30 border-white/10 text-white min-h-[100px]"
              maxLength={500}
            />
            <p className="text-white/40 text-xs mt-1">{comment.length}/500</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-white/10 text-white/60 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={() => submitReviewMutation.mutate()}
            disabled={!ratingType || submitReviewMutation.isPending}
            className="flex-1 nova-gradient"
          >
            {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Anonymous Feedback'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}