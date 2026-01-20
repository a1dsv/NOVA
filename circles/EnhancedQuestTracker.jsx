import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import MetricStepper from './MetricStepper';
import MetricGauge from './MetricGauge';
import MetricHeatmap from './MetricHeatmap';
import NovaProgressRing from './NovaProgressRing';

export default function EnhancedQuestTracker({ 
  quest, 
  onUpdate, 
  isOpen, 
  onClose 
}) {
  const [currentValue, setCurrentValue] = useState(quest.current_value || 0);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [completedDays, setCompletedDays] = useState(quest.completed_days || []);
  const fileInputRef = useRef(null);

  const percentage = (currentValue / quest.target_value) * 100;
  const isComplete = currentValue >= quest.target_value;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImagePreview(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProgress = async () => {
    // Photo proof required for completion
    if (isComplete && !imagePreview) {
      toast.error('Challenge complete! Upload photo proof to finalize.', {
        icon: <AlertCircle className="w-5 h-5" />
      });
      return;
    }

    try {
      await onUpdate({
        current_value: currentValue,
        proof_url: imagePreview,
        status: isComplete ? 'completed' : 'active',
        completed_days: completedDays
      });
      
      onClose();
      
      if (isComplete) {
        toast.success('🎉 Quest completed! Epic work!');
      } else {
        toast.success('Progress updated!');
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleToggleDay = (day) => {
    const dayStr = day.toISOString().split('T')[0];
    const newCompletedDays = completedDays.includes(dayStr)
      ? completedDays.filter(d => d !== dayStr)
      : [...completedDays, dayStr];
    
    setCompletedDays(newCompletedDays);
    setCurrentValue(newCompletedDays.length);
  };

  // Determine tracking style based on metric type
  const getTrackingStyle = () => {
    if (quest.tracking_style) return quest.tracking_style;
    
    // Auto-detect based on metric type
    if (quest.metric_type === 'streak') return 'heatmap';
    if (quest.metric_type === 'count' || quest.metric_type === 'volume') return 'stepper';
    if (quest.metric_type === 'time' || quest.metric_type === 'distance') return 'gauge';
    
    return 'stepper'; // default
  };

  const trackingStyle = getTrackingStyle();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[100000] flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-h-[85vh] bg-zinc-900 rounded-t-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{quest.goal_title}</h3>
                <p className="text-white/60 text-xs mt-0.5">
                  Target: {quest.target_value} {quest.metric_unit}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Progress Ring */}
              <div className="flex justify-center mb-6">
                <NovaProgressRing
                  current={currentValue}
                  target={quest.target_value}
                  unit={quest.metric_unit}
                  size={180}
                  strokeWidth={14}
                />
              </div>

              {/* Tracking Interface */}
              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                {trackingStyle === 'stepper' && (
                  <MetricStepper
                    value={currentValue}
                    onChange={setCurrentValue}
                    unit={quest.metric_unit}
                    max={quest.target_value}
                    step={1}
                  />
                )}

                {trackingStyle === 'gauge' && (
                  <MetricGauge
                    value={currentValue}
                    onChange={setCurrentValue}
                    unit={quest.metric_unit}
                    max={quest.target_value}
                    min={0}
                  />
                )}

                {trackingStyle === 'heatmap' && (
                  <MetricHeatmap
                    completedDays={completedDays}
                    onToggleDay={handleToggleDay}
                    month={quest.month}
                    year={quest.year}
                  />
                )}
              </div>

              {/* Photo Upload - Required for Completion */}
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] backdrop-blur-xl border-2 rounded-2xl p-4"
                  style={{
                    borderColor: imagePreview ? 'var(--nova-accent)' : 'rgba(255,255,255,0.1)',
                    boxShadow: imagePreview ? '0 0 20px var(--nova-accent-glow)' : 'none'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5" style={{ color: 'var(--nova-accent)' }} />
                    <p className="text-white font-bold text-sm">Photo Proof Required</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Proof"
                        className="w-full rounded-xl max-h-48 object-cover"
                      />
                      <button
                        onClick={() => setImagePreview(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors hover:bg-white/5"
                      style={{ borderColor: 'var(--nova-accent)' }}
                    >
                      {uploading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8" style={{ color: 'var(--nova-accent)' }} />
                          <p className="text-white/60 text-sm">Upload completion proof</p>
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 p-4 border-t border-white/10">
              <Button
                onClick={handleUpdateProgress}
                disabled={isComplete && !imagePreview}
                className="w-full h-12 nova-gradient font-bold text-sm uppercase tracking-wider"
              >
                {isComplete ? '🏆 Complete Quest' : 'Update Progress'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}