import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddSocialLinksModal({ user, onClose }) {
  const [socialLinks, setSocialLinks] = useState({
    instagram: user?.social_links?.instagram || '',
    twitter: user?.social_links?.twitter || '',
    youtube: user?.social_links?.youtube || '',
    linkedin: user?.social_links?.linkedin || '',
  });

  const queryClient = useQueryClient();

  const updateSocialMutation = useMutation({
    mutationFn: async () => {
      // Count valid social links (max 2 for rating)
      const validLinksCount = Object.values(socialLinks).filter(link => link && link.trim()).length;
      const socialLinksBonus = Math.min(2, validLinksCount) * 0.5;
      
      // Calculate trust stars
      const hasProfilePicture = user?.profile_picture ? 1 : 0;
      
      // Get friends count
      const allFriends = await base44.entities.Friend.filter({ status: 'accepted' });
      const userFriends = allFriends.filter(f => f.user_id === user.id || f.friend_id === user.id);
      const friendsBonus = userFriends.length >= 3 ? 1 : 0;
      
      // Get cautions count
      const cautionCount = user?.caution_count || 0;
      
      const newTrustStars = Math.max(1, 2 + hasProfilePicture + socialLinksBonus + friendsBonus - cautionCount);
      
      return base44.auth.updateMe({ 
        social_links: socialLinks,
        trust_stars: newTrustStars
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      queryClient.invalidateQueries(['current-user']);
      queryClient.invalidateQueries(['user-profile']);
      queryClient.invalidateQueries(['trust-reviews']);
      queryClient.invalidateQueries(['user-friends-count']);
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10002] flex items-center justify-center p-4"
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
          <h2 className="text-white font-bold text-lg">Link Social Media</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-white/60 text-sm">
            Link your social media profiles to increase your trust rating (+0.5 star per link)
          </p>

          <div>
            <label className="text-white/60 text-sm mb-2 block flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </label>
            <Input
              value={socialLinks.instagram}
              onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
              placeholder="instagram.com/username"
              className="bg-black/30 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter / X
            </label>
            <Input
              value={socialLinks.twitter}
              onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
              placeholder="twitter.com/username"
              className="bg-black/30 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              YouTube
            </label>
            <Input
              value={socialLinks.youtube}
              onChange={(e) => setSocialLinks({...socialLinks, youtube: e.target.value})}
              placeholder="youtube.com/@username"
              className="bg-black/30 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </label>
            <Input
              value={socialLinks.linkedin}
              onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
              placeholder="linkedin.com/in/username"
              className="bg-black/30 border-white/10 text-white"
            />
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
            onClick={() => updateSocialMutation.mutate()}
            disabled={updateSocialMutation.isPending}
            className="flex-1 nova-gradient"
          >
            {updateSocialMutation.isPending ? 'Saving...' : 'Save Links'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}