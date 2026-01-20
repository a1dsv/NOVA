import React, { useRef, useState } from 'react';
import { Camera, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateReadiness, getReadinessStatus } from '@/components/performanceEngine';
import html2canvas from 'html2canvas';

export default function ChallengeProofOverlay({ challenge, onComplete }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const overlayRef = useRef(null);
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => base44.auth.me()
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-overlay', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
    initialData: []
  });

  const readinessData = calculateReadiness(workouts);
  const overallStatus = getReadinessStatus(readinessData.overall);

  // Count recovery rounds in last 48 hours
  const recoveryRoundsLast48h = workouts
    .filter(w => {
      const hoursSince = (Date.now() - new Date(w.created_date).getTime()) / (1000 * 60 * 60);
      return hoursSince <= 48 && w.workout_type === 'recovery';
    })
    .reduce((total, workout) => {
      const chapters = workout.session_data?.chapters || [];
      return total + chapters.filter(c => c.type === 'recovery').length;
    }, 0);

  const handleCapture = async () => {
    if (!overlayRef.current) return;

    try {
      const canvas = await html2canvas(overlayRef.current, {
        backgroundColor: '#000000',
        scale: 2
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'challenge-proof.png', { type: 'image/png' });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onComplete(file_url);
    } catch (error) {
      console.error('Failed to capture proof:', error);
      alert('Failed to capture proof. Please try again.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required for photo proof');
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    setCapturedImage(canvas.toDataURL('image/png'));
    
    // Stop camera
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    setShowCamera(false);
  };

  const zones = [
    { id: 'upper_body', label: 'Upper', score: readinessData.zones.upper_body },
    { id: 'lower_body', label: 'Lower', score: readinessData.zones.lower_body },
    { id: 'cns', label: 'CNS', score: readinessData.zones.cns }
  ];

  const colorMap = {
    green: { bar: 'bg-green-500', text: 'text-green-400' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-400' },
    red: { bar: 'bg-red-500', text: 'text-red-400' }
  };

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col">
      {!showCamera && !capturedImage && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            <div className="text-4xl mb-4">📸</div>
            <h2 className="text-white font-bold text-2xl">Challenge Proof</h2>
            <p className="text-white/60">
              Capture your achievement with readiness overlay
            </p>
            <Button
              onClick={startCamera}
              className="w-full h-14 nova-gradient text-white font-semibold"
            >
              <Camera className="w-5 h-5 mr-2" />
              Take Photo
            </Button>
            <Button
              onClick={onComplete}
              variant="outline"
              className="w-full"
            >
              Skip Photo
            </Button>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="relative flex-1">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <button
              onClick={captureFromCamera}
              className="w-20 h-20 rounded-full bg-white border-4 border-cyan-400 shadow-lg active:scale-95 transition-transform"
            />
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="flex-1 flex flex-col">
          <div ref={overlayRef} className="relative flex-1 bg-black">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            
            {/* Readiness Overlay */}
            <div className="absolute top-6 left-6 right-6 bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white/60 text-xs uppercase tracking-wider">Challenge</div>
                  <div className="text-white font-bold text-lg">{challenge?.title}</div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${colorMap[overallStatus.color].text}`}>
                    {readinessData.overall}%
                  </div>
                  <div className="text-white/60 text-xs">{overallStatus.label}</div>
                </div>
              </div>

              <div className="space-y-2">
                {zones.map(zone => {
                  const status = getReadinessStatus(zone.score);
                  const colors = colorMap[status.color];
                  
                  return (
                    <div key={zone.id} className="flex items-center gap-2">
                      <div className="text-white/60 text-xs w-12">{zone.label}</div>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors.bar}`}
                          style={{ width: `${zone.score}%` }}
                        />
                      </div>
                      <div className="text-white text-xs font-bold w-10 text-right">
                        {Math.round(zone.score)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {recoveryRoundsLast48h > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-cyan-400 text-xs">
                    🧊 {recoveryRoundsLast48h} recovery round{recoveryRoundsLast48h !== 1 ? 's' : ''} (48h)
                  </div>
                </div>
              )}

              <div className="mt-3 text-white/40 text-[10px] text-center">
                {new Date().toLocaleDateString()} • NOVA Athletic Proof
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 bg-zinc-900">
            <Button
              onClick={handleCapture}
              className="w-full h-14 nova-gradient text-white font-semibold"
            >
              <Download className="w-5 h-5 mr-2" />
              Save & Submit
            </Button>
            <Button
              onClick={() => setCapturedImage(null)}
              variant="outline"
              className="w-full"
            >
              Retake
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}