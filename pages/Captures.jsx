import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Heart, MapPin, Plus, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Captures() {
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: captures = [] } = useQuery({
    queryKey: ['captures'],
    queryFn: () => base44.entities.Capture.list('-created_date', 50),
  });

  const { data: captureUsers = [] } = useQuery({
    queryKey: ['capture-users'],
    queryFn: async () => {
      const userIds = [...new Set(captures.map(c => c.user_id))];
      if (userIds.length === 0) return [];
      const users = await base44.entities.User.list('-created_date', 100);
      return users.filter(u => userIds.includes(u.id));
    },
    enabled: captures.length > 0,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      return base44.entities.Capture.create({
        user_id: user.id,
        user_name: user.full_name,
        image_url: file_url,
        caption,
        location_name: location,
        likes: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['captures']);
      setShowUpload(false);
      setCaption('');
      setLocation('');
      setSelectedFile(null);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (capture) => {
      const likes = capture.likes || [];
      const newLikes = likes.includes(user.id)
        ? likes.filter(id => id !== user.id)
        : [...likes, user.id];
      return base44.entities.Capture.update(capture.id, { likes: newLikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['captures']);
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl nova-gradient flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">CAPTURES</h1>
                  <p className="text-white/40 text-xs uppercase tracking-widest">Your Memories</p>
                </div>
              </div>
              <Button
                onClick={() => setShowUpload(true)}
                className="nova-gradient w-10 h-10 p-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white font-bold text-lg">New Capture</h2>
                  <button
                    onClick={() => setShowUpload(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block w-full">
                      <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 transition-colors">
                        {selectedFile ? (
                          <div>
                            <Camera className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                            <p className="text-white text-sm">{selectedFile.name}</p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-12 h-12 text-white/40 mx-auto mb-2" />
                            <p className="text-white/40 text-sm">Click to upload photo</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Caption</label>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Share your memory..."
                      className="bg-black/30 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Location</label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where was this?"
                      className="bg-black/30 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="w-full nova-gradient h-12"
                  >
                    {uploadMutation.isPending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Post Capture
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Captures Grid */}
        <div className="p-4">
          {captures.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No captures yet</p>
              <p className="text-white/30 text-sm mt-1">Share your fitness journey</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {captures.map((capture, index) => (
                <motion.div
                  key={capture.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-square">
                    <img
                      src={capture.image_url}
                      alt={capture.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {captureUsers.find(u => u.id === capture.user_id)?.profile_picture ? (
                            <img 
                              src={captureUsers.find(u => u.id === capture.user_id).profile_picture} 
                              alt={capture.user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                              {capture.user_name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{capture.user_name}</p>
                          {capture.location_name && (
                            <div className="flex items-center gap-1 text-white/40 text-xs">
                              <MapPin className="w-3 h-3" />
                              {capture.location_name}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => likeMutation.mutate(capture)}
                        className="flex items-center gap-1"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            capture.likes?.includes(user?.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-white/40'
                          }`}
                        />
                        <span className="text-white/60 text-sm">{capture.likes?.length || 0}</span>
                      </button>
                    </div>
                    {capture.caption && (
                      <p className="text-white/70 text-sm">{capture.caption}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}