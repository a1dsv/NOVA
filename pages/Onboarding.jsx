import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setProfilePicture(currentUser?.profile_picture || '');
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfilePicture(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleInitialize = async () => {
    if (!username || username.trim() === '') {
      setError('Username is required');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Check if username is unique
    const handleInitialize = async () => {
    if (!username || username.trim() === '') {
      setError('Username is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // We skip the 'filter' check that caused the error 
      // and go straight to the update.
      await base44.auth.updateMe({
        username,
        profile_picture: profilePicture
      });

      navigate(createPageUrl('Dashboard'));
    } catch (err) {
      console.error('Initialization error:', err);
      
      // We check if the server rejected it because the name exists
      if (err.message?.includes('unique') || err.status === 409) {
        setError('This identifier is already claimed by another operative.');
      } else {
        setError('Connection failed. Re-initialize system.');
      }
    } finally {
      setSaving(false);
    }
  };

      // Update user with username and photo
      await base44.auth.updateMe({
        username,
        profile_picture: profilePicture
      });

      // Navigate to dashboard
      navigate(createPageUrl('Dashboard'));
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(err.message || 'Failed to initialize system');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Nova Violet Radial Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>

      {/* Main Identity Cockpit */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                Nova ID
              </h1>
              <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Initialize your presence in the system
              </p>
            </motion.div>
          </div>

          {/* Photo Upload Zone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="mb-8"
          >
            <label className="text-white/40 text-xs mb-3 block uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
              Identity Photo (Optional)
            </label>
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-violet-500/50 transition-all">
                  {uploadingPhoto ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    </div>
                  ) : profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                      <Camera className="w-10 h-10 text-white/40" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
          </motion.div>

          {/* Username Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
            className="mb-6"
          >
            <label className="text-white/40 text-xs mb-3 block uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
              Assign Identifier (Required)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-lg">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  setError('');
                }}
                placeholder="username"
                maxLength={20}
                className="w-full h-14 bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl pl-10 pr-4 text-white font-mono text-lg focus:outline-none focus:border-violet-500/50 transition-colors"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>
            <p className="text-white/30 text-xs mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Lowercase letters, numbers, and underscores only
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center"
            >
              <p className="text-red-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
            </motion.div>
          )}

          {/* Initialize Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInitialize}
            disabled={saving || !username}
            className="w-full h-16 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-xl font-bold text-white text-lg uppercase tracking-wider shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing...
              </span>
            ) : (
              'Initialize System'
            )}
          </motion.button>

          {/* User Info Display */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 pt-6 border-t border-white/10 text-center"
            >
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Authenticated as
              </p>
              <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                {user.email}
              </p>
            </motion.div>
          )}
        </div>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-white/20 text-xs mt-6"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Your identifier will be permanent and visible to others
        </motion.p>
      </motion.div>
    </div>
  );
}