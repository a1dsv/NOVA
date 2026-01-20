import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  User, Camera, LogOut, Edit2, Instagram, Twitter, Youtube, Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ImproveTrustCard from '@/components/profile/ImproveTrustCard';
import TrustRatingCard from '@/components/profile/TrustRatingCard';

export default function Account() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUserData, refetch: refetchUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (currentUserData) {
      setUser(currentUserData);
      setEditData({
        full_name: currentUserData?.full_name || '',
        bio: currentUserData?.bio || '',
        interests: currentUserData?.interests || '',
        username: currentUserData?.username || '',
        profile_picture: currentUserData?.profile_picture || '',
        social_links: currentUserData?.social_links || {}
      });
    }
  }, [currentUserData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Check if username is unique
      if (data.username && data.username !== user?.username) {
        const existingUsers = await base44.entities.User.filter({ username: data.username });
        if (existingUsers.length > 0) {
          throw new Error('Username already taken');
        }
      }
      
      // Calculate trust stars
      const hasProfilePicture = data.profile_picture ? 1 : 0;
      const socialLinksCount = data.social_links 
        ? Object.values(data.social_links).filter(link => link && link.trim()).length 
        : 0;
      const socialLinksBonus = Math.min(2, socialLinksCount) * 0.5;
      
      // Get friends count
      const allFriends = await base44.entities.Friend.filter({ status: 'accepted' });
      const userFriends = allFriends.filter(f => f.user_id === user.id || f.friend_id === user.id);
      const friendsBonus = userFriends.length >= 3 ? 1 : 0;
      
      // Get cautions count
      const cautionCount = user?.caution_count || 0;
      
      const newTrustStars = Math.max(1, 2 + hasProfilePicture + socialLinksBonus + friendsBonus - cautionCount);
      
      return base44.auth.updateMe({ ...data, trust_stars: newTrustStars });
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setIsEditing(false);
      queryClient.invalidateQueries(['user']);
      queryClient.invalidateQueries(['current-user']);
      queryClient.invalidateQueries(['user-profile']);
      queryClient.invalidateQueries(['trust-reviews']);
    },
    onError: (error) => {
      alert(error.message || 'Failed to update profile');
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditData({ ...editData, profile_picture: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Fetch trust reviews
  const { data: trustReviews = [] } = useQuery({
    queryKey: ['trust-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allReviews = await base44.entities.TrustReview.filter({ reviewed_user_id: user.id }, '-created_date', 10);
      return allReviews;
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-white uppercase tracking-wider">Profile</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Profile Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                {editData.profile_picture ? (
                  <img 
                    src={editData.profile_picture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-2xl font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-600 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
              <p className="text-white/40 text-sm">{user?.email}</p>
              {user?.role === 'admin' && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mt-2">
                  Admin
                </Badge>
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Full Name</label>
                <Input
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="bg-black/30 border-white/10 text-white"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Username</label>
                <Input
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="username"
                  className="bg-black/30 border-white/10 text-white"
                  maxLength={20}
                />
                <p className="text-white/40 text-xs mt-1">Lowercase letters, numbers, and underscores only</p>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Bio</label>
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="bg-black/30 border-white/10 text-white min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Interests</label>
                <Input
                  value={editData.interests}
                  onChange={(e) => setEditData({ ...editData, interests: e.target.value })}
                  placeholder="e.g., Running, Boxing, Yoga"
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Social Media Links</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-white/40" />
                    <Input
                      value={editData.social_links?.instagram || ''}
                      onChange={(e) => setEditData({...editData, social_links: {...(editData.social_links || {}), instagram: e.target.value}})}
                      placeholder="instagram.com/username"
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-white/40" />
                    <Input
                      value={editData.social_links?.twitter || ''}
                      onChange={(e) => setEditData({...editData, social_links: {...(editData.social_links || {}), twitter: e.target.value}})}
                      placeholder="twitter.com/username"
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-white/40" />
                    <Input
                      value={editData.social_links?.youtube || ''}
                      onChange={(e) => setEditData({...editData, social_links: {...(editData.social_links || {}), youtube: e.target.value}})}
                      placeholder="youtube.com/@username"
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-white/40" />
                    <Input
                      value={editData.social_links?.linkedin || ''}
                      onChange={(e) => setEditData({...editData, social_links: {...(editData.social_links || {}), linkedin: e.target.value}})}
                      placeholder="linkedin.com/in/username"
                      className="bg-black/30 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex-1 nova-gradient h-12 rounded-lg font-medium"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      full_name: user?.full_name || '',
                      bio: user?.bio || '',
                      interests: user?.interests || '',
                      username: user?.username || '',
                      profile_picture: user?.profile_picture || '',
                      social_links: user?.social_links || {}
                    });
                    }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="border border-white/10 text-white h-12 px-6 rounded-lg font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {user?.username && (
                <div>
                  <p className="text-white/40 text-xs mb-1">USERNAME</p>
                  <p className="text-white/80 text-sm">@{user.username}</p>
                </div>
              )}
              {user?.bio && (
                <div>
                  <p className="text-white/40 text-xs mb-1">BIO</p>
                  <p className="text-white/80 text-sm">{user.bio}</p>
                </div>
              )}
              {user?.interests && (
                <div>
                  <p className="text-white/40 text-xs mb-2">INTERESTS</p>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.split(',').map((interest, idx) => (
                      <Badge 
                        key={idx}
                        className="bg-violet-500/20 text-violet-400 border-violet-500/30"
                      >
                        {interest.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!user?.username && !user?.bio && !user?.interests && (
                <p className="text-white/40 text-sm text-center py-4">
                  Click edit to add your profile details
                </p>
              )}
            </div>
          )}
        </div>

        {/* Trust Rating Card */}
        {user && (
          <TrustRatingCard user={user} trustReviews={trustReviews} />
        )}

        {/* Improve Trust Card */}
        {user && (
          <div className="mt-6">
            <ImproveTrustCard user={user} />
          </div>
        )}

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full h-14 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 mt-6 rounded-xl font-medium flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </motion.button>
      </div>
    </div>
  );
}