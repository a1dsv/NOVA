import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Application() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.application_status === 'approved') {
          navigate(createPageUrl('Pulse'));
        }
      } catch (e) {
        // Not logged in, redirect to login
        base44.auth.redirectToLogin(createPageUrl('Application'));
      }
    };
    loadUser();
  }, [navigate]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({
        bio,
        application_status: 'approved',
        reliability_score: 3,
        consistency_streak: 0,
        events_attended: 0,
        events_hosted: 0,
        tribe_rank: 'initiate',
        recovery_percentage: 85,
        weekly_activity_minutes: 0,
        previous_playlists: [],
      });
      
      navigate(createPageUrl('Pulse'));
    } catch (e) {
      console.error('Failed to submit:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69587c2e9dd9113c4d857e1d/e314d2a42_Nova2_01-03.png"
            alt="NOVA"
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="text-4xl font-black nova-gradient-text tracking-tight">NOVA</h1>
          <p className="text-white/40 text-sm mt-2">Join the movement</p>
        </div>
        
        {/* Form */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-2 block">Full Name</label>
            <Input
              value={user?.full_name || ''}
              disabled
              className="bg-black/30 border-white/10 text-white"
            />
          </div>
          
          <div>
            <label className="text-white/60 text-sm mb-2 block">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-black/30 border-white/10 text-white"
            />
          </div>
          
          <div>
            <label className="text-white/60 text-sm mb-2 block">Bio (optional)</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              className="bg-black/30 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
            />
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 nova-gradient nova-glow-violet text-white font-semibold"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Join NOVA
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}