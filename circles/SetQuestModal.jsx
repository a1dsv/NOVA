import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endOfMonth } from 'date-fns';

export default function SetQuestModal({ isOpen, onClose, circleId, userId, existingQuest, isEditing }) {
  const queryClient = useQueryClient();
  const [goalTitle, setGoalTitle] = useState(existingQuest?.goal_title || '');
  const [baselinePhoto, setBaselinePhoto] = useState(existingQuest?.baseline_photo_url || null);
  const [uploading, setUploading] = useState(false);
  const [targetValue, setTargetValue] = useState(existingQuest?.target_value?.toString() || '');
  const [metricType, setMetricType] = useState(existingQuest?.metric_type || 'count');
  const [metricUnit, setMetricUnit] = useState(existingQuest?.metric_unit || '');
  const [metricPeriod, setMetricPeriod] = useState(existingQuest?.metric_period || 'total');
  const [timeHours, setTimeHours] = useState(existingQuest?.time_hours?.toString() || '');
  const [timeMinutes, setTimeMinutes] = useState(existingQuest?.time_minutes?.toString() || '');
  const [timeSeconds, setTimeSeconds] = useState(existingQuest?.time_seconds?.toString() || '');

  // Update form when existingQuest changes
  useEffect(() => {
    if (existingQuest && isEditing) {
      setGoalTitle(existingQuest.goal_title || '');
      setBaselinePhoto(existingQuest.baseline_photo_url || null);
      setTargetValue(existingQuest.target_value?.toString() || '');
      setMetricType(existingQuest.metric_type || 'count');
      setMetricUnit(existingQuest.metric_unit || '');
      setMetricPeriod(existingQuest.metric_period || 'total');
      setTimeHours(existingQuest.time_hours?.toString() || '');
      setTimeMinutes(existingQuest.time_minutes?.toString() || '');
      setTimeSeconds(existingQuest.time_seconds?.toString() || '');
    }
  }, [existingQuest, isEditing]);

  const createQuestMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const deadline = endOfMonth(now).toISOString().split('T')[0];

      const questData = {
        goal_title: goalTitle,
        baseline_photo_url: baselinePhoto,
        target_value: metricType === 'time' 
          ? (parseInt(timeHours || 0) * 3600 + parseInt(timeMinutes || 0) * 60 + parseInt(timeSeconds || 0))
          : parseFloat(targetValue),
        metric_type: metricType,
        metric_unit: metricUnit,
        metric_period: metricPeriod,
      };

      if (metricType === 'time') {
        questData.time_hours = parseInt(timeHours || 0);
        questData.time_minutes = parseInt(timeMinutes || 0);
        questData.time_seconds = parseInt(timeSeconds || 0);
      }

      if (isEditing && existingQuest) {
        // Update existing quest
        return await base44.entities.MonthlyQuest.update(existingQuest.id, questData);
      } else {
        // Create new quest
        questData.user_id = userId;
        questData.circle_id = circleId;
        questData.month = month;
        questData.year = year;
        questData.deadline = deadline;
        questData.current_value = 0;
        questData.status = 'active';
        return await base44.entities.MonthlyQuest.create(questData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['monthly-quests', circleId]);
      queryClient.invalidateQueries(['my-quest-check']);
      queryClient.invalidateQueries(['circle-quests']);
      queryClient.invalidateQueries(['my-quest-feed']);
      onClose();
      if (!isEditing) {
        setGoalTitle('');
        setBaselinePhoto(null);
        setTargetValue('');
        setMetricUnit('');
        setMetricPeriod('total');
        setTimeHours('');
        setTimeMinutes('');
        setTimeSeconds('');
      }
    },
  });

  const optOutMutation = useMutation({
    mutationFn: async () => {
      if (!existingQuest) return;
      return await base44.entities.MonthlyQuest.update(existingQuest.id, {
        status: 'archived'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['monthly-quests', circleId]);
      queryClient.invalidateQueries(['my-quest-check']);
      queryClient.invalidateQueries(['circle-quests']);
      queryClient.invalidateQueries(['my-quest-feed']);
      onClose();
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBaselinePhoto(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const isTimeValid = metricType === 'time' 
      ? (timeHours || timeMinutes || timeSeconds)
      : targetValue;
    
    if (goalTitle.trim() && baselinePhoto && isTimeValid && metricUnit.trim()) {
      createQuestMutation.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
        style={{ paddingBottom: '120px' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl nova-gradient flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">
                  {isEditing ? 'Edit Your Quest' : 'Set Your Monthly Quest'}
                </h2>
                <p className="text-white/40 text-sm">
                  {isEditing ? 'Update your monthly goal' : "What's your goal this month?"}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5"
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Goal Title */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Goal Title</label>
              <Input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Hit 120kg Bench Press"
                className="bg-zinc-800 border-white/10 text-white"
              />
            </div>

            {/* Metric Type */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Metric Type</label>
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white rounded-lg p-3"
              >
                <option value="count">Count (reps, sessions)</option>
                <option value="time">Time (hours, minutes, seconds)</option>
                <option value="weight">Weight (lbs, kg)</option>
                <option value="distance">Distance (km, miles)</option>
                <option value="volume">Volume (total weight x reps)</option>
              </select>
            </div>

            {/* Target Value */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Target Value</label>
              {metricType === 'time' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      value={timeHours}
                      onChange={(e) => setTimeHours(e.target.value)}
                      placeholder="0"
                      className="bg-zinc-800 border-white/10 text-white text-center"
                    />
                    <p className="text-white/40 text-xs text-center mt-1">Hours</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      placeholder="0"
                      className="bg-zinc-800 border-white/10 text-white text-center"
                    />
                    <p className="text-white/40 text-xs text-center mt-1">Mins</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={timeSeconds}
                      onChange={(e) => setTimeSeconds(e.target.value)}
                      placeholder="0"
                      className="bg-zinc-800 border-white/10 text-white text-center"
                    />
                    <p className="text-white/40 text-xs text-center mt-1">Secs</p>
                  </div>
                </div>
              ) : (
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="100"
                  className="bg-zinc-800 border-white/10 text-white"
                />
              )}
            </div>

            {/* Metric Unit & Period */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Unit & Period</label>
              <div className="flex gap-2">
                <Input
                  value={metricUnit}
                  onChange={(e) => setMetricUnit(e.target.value)}
                  placeholder={metricType === 'volume' ? 'lbs' : metricType === 'time' ? 'running' : 'kicks / km / lbs'}
                  className="flex-1 bg-zinc-800 border-white/10 text-white"
                />
                <select
                  value={metricPeriod}
                  onChange={(e) => setMetricPeriod(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-white/10 text-white rounded-lg p-2 text-sm"
                >
                  <option value="total">Total</option>
                  <option value="per_day">Per Day</option>
                  <option value="per_run">Per Run</option>
                  <option value="per_session">Per Session</option>
                  <option value="per_week">Per Week</option>
                </select>
              </div>
            </div>

            {/* Baseline Photo */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Baseline Proof (Required)</label>
              {baselinePhoto ? (
                <div className="relative">
                  <img src={baselinePhoto} alt="Baseline" className="w-full rounded-xl" />
                  <Button
                    onClick={() => setBaselinePhoto(null)}
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-violet-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-white/40 mb-2" />
                      <p className="text-white/40 text-sm">Upload your starting point</p>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Deadline Info */}
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3">
              <p className="text-violet-400 text-sm">
                ⏰ Deadline: {endOfMonth(new Date()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={
                !goalTitle.trim() || 
                !baselinePhoto || 
                (metricType === 'time' ? !(timeHours || timeMinutes || timeSeconds) : !targetValue) || 
                !metricUnit.trim() || 
                createQuestMutation.isPending
              }
              className="w-full nova-gradient h-12 font-semibold relative z-10"
            >
              {createQuestMutation.isPending 
                ? (isEditing ? 'Updating...' : 'Setting Quest...') 
                : (isEditing ? 'Update Quest' : 'Set My Quest')}
            </Button>

            {isEditing && (
              <Button
                onClick={() => optOutMutation.mutate()}
                disabled={optOutMutation.isPending}
                variant="outline"
                className="w-full h-12 border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                {optOutMutation.isPending ? 'Opting Out...' : 'Opt Out of Quest'}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}