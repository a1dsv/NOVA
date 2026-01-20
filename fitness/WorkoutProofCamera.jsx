import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Check, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function WorkoutProofCamera({ workoutData, onComplete, onSkip }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Force-launch camera immediately
  useEffect(() => {
    const triggerCamera = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };
    
    // Trigger after a brief delay to ensure DOM is ready
    setTimeout(triggerCamera, 300);
  }, []);

  const handleFileCapture = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const drawStatsOverlay = (img) => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the captured image
      ctx.drawImage(img, 0, 0);

      // Prepare stats overlay
      const workoutType = workoutData.workout_type?.toUpperCase() || 'WORKOUT';
      let statsText = [];

      switch (workoutData.workout_type) {
        case 'gym':
        case 'calisthenics':
          const totalVolume = workoutData.total_volume || 0;
          const totalSets = workoutData.exercises?.reduce((sum, ex) => 
            sum + (ex.set_records?.filter(s => s.completed).length || 0), 0) || 0;
          statsText = [
            `${workoutType} SESSION`,
            `${workoutData.exercises?.length || 0} Exercises`,
            `${totalSets} Sets`,
            `${Math.round(totalVolume)} kg Volume`
          ];
          break;

        case 'martial_arts':
          const rounds = workoutData.round_timer_data?.totalRounds || 0;
          const duration = workoutData.duration_minutes || 0;
          statsText = [
            `COMBAT SESSION`,
            `${rounds} Rounds`,
            `${duration} Minutes`
          ];
          break;

        case 'run':
          const distance = workoutData.distance || 0;
          const runDuration = workoutData.duration_minutes || 0;
          statsText = [
            `RUN SESSION`,
            `${distance.toFixed(2)} km`,
            `${runDuration} Minutes`
          ];
          break;

        default:
          statsText = [
            `${workoutType}`,
            `${workoutData.duration_minutes || 0} Minutes`
          ];
      }

      // Draw overlay box
      const boxHeight = 140;
      const boxY = canvas.height - boxHeight - 30;
      const boxPadding = 20;

      // Semi-transparent black background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(boxPadding, boxY, canvas.width - (boxPadding * 2), boxHeight);

      // Border with gradient effect
      const gradient = ctx.createLinearGradient(0, boxY, canvas.width, boxY);
      gradient.addColorStop(0, '#8F00FF');
      gradient.addColorStop(1, '#00F2FF');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxPadding, boxY, canvas.width - (boxPadding * 2), boxHeight);

      // Draw stats text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      const textX = canvas.width / 2;
      let textY = boxY + 40;

      statsText.forEach((line, idx) => {
        if (idx === 0) {
          ctx.font = 'bold 32px Inter, sans-serif';
          ctx.fillStyle = '#00F2FF';
        } else {
          ctx.font = 'bold 24px Inter, sans-serif';
          ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(line, textX, textY);
        textY += idx === 0 ? 38 : 30;
      });

      // Date stamp
      const date = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#999999';
      ctx.fillText(date, textX, boxY + boxHeight - 15);

      // Convert to blob
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);

    try {
      // Load image
      const img = new Image();
      img.src = capturedImage;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Draw stats overlay
      const overlayedBlob = await drawStatsOverlay(img);
      const file = new File([overlayedBlob], 'workout-proof.jpg', { type: 'image/jpeg' });

      // Upload to server
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Call onComplete with proof URL
      onComplete(file_url);

      // Clear localStorage since workout is complete
      localStorage.removeItem('active_workout');
      localStorage.removeItem('round_timer_state');
    } catch (error) {
      console.error('Photo processing failed:', error);
      alert('Failed to process photo. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input for native camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        className="hidden"
        id="cameraInput"
      />

      {capturedImage ? (
        <>
          {/* Preview */}
          <div className="flex-1 relative bg-black">
            <img 
              src={capturedImage} 
              alt="Captured proof" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Controls */}
          <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 p-6 space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex-1 h-14 bg-white/5 border-white/10 text-white"
              >
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
              >
                {isProcessing ? (
                  <>
                    <Upload className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Confirm & Upload
                  </>
                )}
              </Button>
            </div>
            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full text-white/40 hover:text-white/60"
            >
              Skip Photo (Not Recommended)
            </Button>
          </div>
        </>
      ) : (
        // Waiting state (camera should be launching)
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto rounded-full nova-gradient flex items-center justify-center"
            >
              <Camera className="w-10 h-10 text-white" />
            </motion.div>
            <p className="text-white text-lg">Opening camera...</p>
            <p className="text-white/60 text-sm">Take a photo to verify your workout</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-white/10 hover:bg-white/20 text-white"
            >
              Tap to open camera manually
            </Button>
            <Button
              onClick={onSkip}
              variant="ghost"
              className="text-white/40 hover:text-white/60"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}