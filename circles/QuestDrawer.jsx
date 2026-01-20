import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Upload, Camera, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { startOfMonth, endOfMonth, differenceInDays, format } from 'date-fns';

export default function QuestDrawer({ circleId, currentUserId }) {
  const queryClient = useQueryClient();
  const [uploadingProgress, setUploadingProgress] = useState(false);
  const [uploadingFinal, setUploadingFinal] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const daysLeft = differenceInDays(endOfMonth(now), now);
  const canSubmitFinal = daysLeft <= 7;

  // Fetch my quest
  const { data: myQuest } = useQuery({
    queryKey: ['my-quest', circleId, currentUserId, month, year],
    queryFn: async () => {
      const quests = await base44.entities.MonthlyQuest.filter({
        circle_id: circleId,
        user_id: currentUserId,
        month,
        year,
      }, '-created_date', 1);
      return quests[0] || null;
    },
    enabled: !!circleId && !!currentUserId,
  });

  // Upload progress photo
  const uploadProgressMutation = useMutation({
    mutationFn: async (photoUrl) => {
      const progressPhotos = myQuest.progress_photos || [];
      progressPhotos.push({
        url: photoUrl,
        uploaded_at: new Date().toISOString(),
      });
      return base44.entities.MonthlyQuest.update(myQuest.id, { progress_photos: progressPhotos });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-quest', circleId, currentUserId, month, year]);
    },
  });

  // Upload final photo
  const uploadFinalMutation = useMutation({
    mutationFn: async (photoUrl) => {
      const currentUser = await base44.auth.me();
      await base44.entities.MonthlyQuest.update(myQuest.id, { 
        final_photo_url: photoUrl,
        status: 'completed'
      });

      // Post in chat
      await base44.entities.CircleMessage.create({
        circle_id: circleId,
        sender_id: 'bot',
        sender_name: 'Quest Bot',
        content: `🏆 ${currentUser.full_name} completed their quest: "${myQuest.goal_title}"!`,
        type: 'system',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-quest', circleId, currentUserId, month, year]);
      queryClient.invalidateQueries(['monthly-quests', circleId]);
    },
  });

  const handleProgressUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProgress(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await uploadProgressMutation.mutateAsync(file_url);
    } finally {
      setUploadingProgress(false);
    }
  };

  const handleFinalUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFinal(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await uploadFinalMutation.mutateAsync(file_url);
    } finally {
      setUploadingFinal(false);
    }
  };

  if (!myQuest) {
    return (
      <div className="px-4 py-6 text-center">
        <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">You haven't set your quest yet</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* My Quest Card */}
      <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-lg">{myQuest.goal_title}</h3>
            <p className="text-white/60 text-xs mt-1">
              {myQuest.status === 'completed' ? '✅ Completed' : `⏰ ${daysLeft} days left`}
            </p>
          </div>
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-white/40 text-xs">Progress Updates</p>
            <p className="text-white font-bold">{myQuest.progress_photos?.length || 0}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2">
            <p className="text-white/40 text-xs">Status</p>
            <p className="text-white font-bold">
              {myQuest.status === 'completed' ? '🏆 Done' : '🔥 Active'}
            </p>
          </div>
        </div>

        {/* Actions */}
        {myQuest.status !== 'completed' && (
          <div className="space-y-2">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleProgressUpload}
                disabled={uploadingProgress}
                className="hidden"
              />
              <Button
                disabled={uploadingProgress}
                className="w-full bg-violet-500/20 text-violet-400 border border-violet-500/50 hover:bg-violet-500/30"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {uploadingProgress ? 'Uploading...' : 'Upload Progress Photo'}
              </Button>
            </label>

            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFinalUpload}
                disabled={uploadingFinal || !canSubmitFinal}
                className="hidden"
              />
              <Button
                disabled={uploadingFinal || !canSubmitFinal}
                className="w-full nova-gradient"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {uploadingFinal ? 'Uploading...' : 
                  canSubmitFinal ? 'Submit Final Result' : 'Available in final week'}
              </Button>
            </label>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      <div>
        <h4 className="text-white/60 text-xs uppercase tracking-wider mb-2">Your Progress</h4>
        
        {/* Baseline */}
        <div className="mb-3">
          <p className="text-white/40 text-xs mb-1">Baseline</p>
          <img 
            src={myQuest.baseline_photo_url} 
            alt="Baseline" 
            className="w-full rounded-xl"
          />
        </div>

        {/* Progress Photos */}
        {myQuest.progress_photos?.length > 0 && (
          <div className="space-y-2">
            {myQuest.progress_photos.map((photo, idx) => (
              <div key={idx}>
                <p className="text-white/40 text-xs mb-1">
                  Update {idx + 1} - {format(new Date(photo.uploaded_at), 'MMM d')}
                </p>
                <img 
                  src={photo.url} 
                  alt={`Progress ${idx + 1}`} 
                  className="w-full rounded-xl"
                />
              </div>
            ))}
          </div>
        )}

        {/* Final Photo */}
        {myQuest.final_photo_url && (
          <div className="mt-3">
            <p className="text-amber-400 text-xs mb-1 font-bold">🏆 Final Result</p>
            <img 
              src={myQuest.final_photo_url} 
              alt="Final" 
              className="w-full rounded-xl border-2 border-amber-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}