import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Target, Zap, Apple, TrendingUp, Sparkles, History, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import useStickyState from '@/components/hooks/useStickyState';
import WorkoutSelector from '@/components/fitness/WorkoutSelector';
import CombatTimerModule from '@/components/fitness/CombatTimerModule';
import RunTrackerModule from '@/components/fitness/RunTrackerModule';
import StrengthModule from '@/components/fitness/StrengthModule';
import RecoveryModule from '@/components/fitness/RecoveryModule';
import ProofCapture from '@/components/fitness/ProofCapture';
import WorkoutSummary from '@/components/fitness/WorkoutSummary';
import NutritionModule from '@/components/nutrition/NutritionModule';
import AnalyticsModule from '@/components/analytics/AnalyticsModule';
import AICoachModule from '@/components/coach/AICoachModule';
import WorkoutHistoryModal from '@/components/fitness/WorkoutHistoryModal';
import ChapterSelector from '@/components/fitness/ChapterSelector';
import SmartInsightsCard from '@/components/dashboard/SmartInsightsCard';
import HybridBalanceRadar from '@/components/goals/HybridBalanceRadar';
import BenchmarkLevels from '@/components/goals/BenchmarkLevels';
import GoalsSection from '@/components/goals/GoalsSection';
import ReadinessGauge from '@/components/fitness/ReadinessGauge';
import ReadinessButton from '@/components/fitness/ReadinessButton';
import { calculateReadiness, getReadinessStatus } from '@/components/performanceEngine';

const STATES = {
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  PROOF: 'PROOF',
  SUMMARY: 'SUMMARY'
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('fitness');
  const [workoutState, setWorkoutState] = useStickyState('nova_workout_state', STATES.IDLE);
  const [sessionData, setSessionData] = useStickyState('nova_session_data', null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Auto-resume logic
  useEffect(() => {
    const checkResume = () => {
      if (workoutState === STATES.ACTIVE && (!sessionData || !sessionData.started_at || !sessionData.chapters)) {
        handleReset();
        return;
      }

      if (sessionData && sessionData.started_at && workoutState === STATES.IDLE) {
        const age = Date.now() - sessionData.started_at;
        if (age < 4 * 60 * 60 * 1000) {
          if (confirm('Resume your previous workout?')) {
            setWorkoutState(STATES.ACTIVE);
          } else {
            handleReset();
          }
        } else {
          handleReset();
        }
      }
    };

    checkResume();
  }, []);

  // Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && workoutState === STATES.ACTIVE) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock failed:', err);
      }
    };

    if (workoutState === STATES.ACTIVE) {
      requestWakeLock();
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [workoutState]);

  const handleStartWorkout = (type, config, condition) => {
    setSessionData({
      workout_type: 'hybrid',
      started_at: Date.now(),
      user_id: user?.id,
      condition: condition || 'fresh',
      chapters: [{
        type,
        config,
        data: {},
        started_at: Date.now()
      }],
      currentChapterIndex: 0
    });
    setWorkoutState(STATES.ACTIVE);
  };

  const handleUpdateSession = (updates) => {
    setSessionData(prev => {
      const chapters = [...prev.chapters];
      chapters[prev.currentChapterIndex] = {
        ...chapters[prev.currentChapterIndex],
        data: { ...chapters[prev.currentChapterIndex].data, ...updates }
      };
      return { ...prev, chapters };
    });
  };

  const handleAddChapter = (type, config, condition) => {
    setShowChapterSelector(false); // Close selector first
    
    // Use setTimeout to ensure selector is unmounted before adding chapter
    setTimeout(() => {
      setSessionData(prev => ({
        ...prev,
        chapters: [...prev.chapters, {
          type,
          config,
          data: {},
          started_at: Date.now()
        }],
        currentChapterIndex: prev.chapters.length
      }));
    }, 10);
  };

  const handleFinishChapter = () => {
    // Mark current chapter as complete, stay in active state
    setSessionData(prev => {
      const chapters = [...prev.chapters];
      chapters[prev.currentChapterIndex] = {
        ...chapters[prev.currentChapterIndex],
        finished_at: Date.now()
      };
      return { ...prev, chapters };
    });
  };

  const handleFinishWorkout = () => {
    setWorkoutState(STATES.PROOF);
  };

  const handleProofComplete = async (photoUrl) => {
    try {
      const duration = Math.round((Date.now() - sessionData.started_at) / 60000);
      
      await base44.entities.Workout.create({
        user_id: user.id,
        workout_type: sessionData.chapters.length > 1 ? 'hybrid' : sessionData.chapters[0].type,
        status: 'finished',
        started_at: new Date(sessionData.started_at).toISOString(),
        finished_at: new Date().toISOString(),
        duration_minutes: duration,
        session_data: { 
          chapters: sessionData.chapters,
          total_chapters: sessionData.chapters.length
        },
        proof_photo_url: photoUrl
      });

      setWorkoutState(STATES.SUMMARY);
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };

  const handleSkipProof = async () => {
    try {
      const duration = Math.round((Date.now() - sessionData.started_at) / 60000);
      
      await base44.entities.Workout.create({
        user_id: user.id,
        workout_type: sessionData.chapters.length > 1 ? 'hybrid' : sessionData.chapters[0].type,
        status: 'finished',
        started_at: new Date(sessionData.started_at).toISOString(),
        finished_at: new Date().toISOString(),
        duration_minutes: duration,
        session_data: { 
          chapters: sessionData.chapters,
          total_chapters: sessionData.chapters.length
        }
      });

      setWorkoutState(STATES.SUMMARY);
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  const handleReset = () => {
    setSessionData(null);
    setWorkoutState(STATES.IDLE);
    localStorage.removeItem('nova_workout_state');
    localStorage.removeItem('nova_session_data');
  };

  const renderModule = () => {
    if (!sessionData || !sessionData.chapters) return null;

    const currentChapter = sessionData.chapters[sessionData.currentChapterIndex];
    if (!currentChapter) return null;

    const moduleProps = {
      config: currentChapter.config,
      data: currentChapter.data,
      onUpdate: handleUpdateSession,
      onFinish: handleFinishChapter,
      onAddChapter: handleAddChapter,
      isMultiModal: true
    };

    switch (currentChapter.type) {
      case 'martial_arts':
        return <CombatTimerModule {...moduleProps} />;
      case 'endurance':
        return <RunTrackerModule {...moduleProps} />;
      case 'strength':
        return <StrengthModule {...moduleProps} />;
      case 'recovery':
        return <RecoveryModule {...moduleProps} />;
      default:
        return <div className="text-white text-center py-20">Unknown workout type</div>;
    }
  };

  const [showAICoach, setShowAICoach] = useState(false);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showReadinessDetail, setShowReadinessDetail] = useState(false);

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user,
    initialData: [],
  });

  const [analyticsSubTab, setAnalyticsSubTab] = useState('overview');

  const tabs = [
    { id: 'fitness', label: 'Fitness', icon: Zap },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'analytics', label: 'Goals & Analytics', icon: TrendingUp, fullWidth: true }
  ];

  return (
    <div className="min-h-screen bg-black">
      {workoutState === STATES.IDLE && (
        <>
          <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
            <div className="px-4 py-3">
              {/* Nova Lab Header - Fixed Across All Tabs */}
              <div className="flex items-center justify-center gap-3 mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(143, 0, 255, 0.4))' }}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69587c2e9dd9113c4d857e1d/e314d2a42_Nova2_01-03.png"
                  alt="NOVA"
                  className="w-10 h-10"
                />
                <h1 className="text-white text-xl font-bold tracking-wider uppercase">Nova Lab</h1>
              </div>

              {/* Compact Header with Tabs */}
              <div className="flex items-center gap-2 mb-3">
                {/* Horizontal Discipline Tabs */}
                {/* Horizontal Discipline Tabs */}
                <div className="flex gap-2 flex-1">
                  {tabs.filter(t => !t.fullWidth).map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all text-xs ${
                          activeTab === tab.id
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Analytics Tab (Full Width) */}
              {tabs.filter(t => t.fullWidth).map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 pt-3 max-w-2xl mx-auto pb-32">
            {activeTab === 'fitness' && (
              <>
                <WorkoutSelector onStart={handleStartWorkout} />

                <Button 
                  onClick={() => setShowWorkoutHistory(true)}
                  className="w-full h-10 bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 text-cyan-400 font-semibold mt-4"
                >
                  <History className="w-4 h-4 mr-2" />
                  Workout History
                </Button>
              </>
            )}

            {activeTab === 'nutrition' && <NutritionModule user={user} />}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Sub-tabs for Analytics & Goals */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'goals', label: 'Goals' },
                    { id: 'performance', label: 'Performance' },
                    { id: 'insights', label: 'Insights' }
                  ].map(subTab => (
                    <button
                      key={subTab.id}
                      onClick={() => setAnalyticsSubTab(subTab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        analyticsSubTab === subTab.id
                          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* Overview Section */}
                {analyticsSubTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-3">Hybrid Balance</h3>
                      <HybridBalanceRadar user={user} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-3">Athletic Benchmarks</h3>
                      <BenchmarkLevels user={user} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-3">Smart Insights</h3>
                      <SmartInsightsCard user={user} />
                    </div>
                  </div>
                )}

                {/* Goals Section */}
                {analyticsSubTab === 'goals' && (
                  <GoalsSection user={user} />
                )}

                {/* Performance Charts */}
                {analyticsSubTab === 'performance' && (
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4">Performance Analytics</h3>
                    <AnalyticsModule user={user} />
                  </div>
                )}

                {/* Insights Section */}
                {analyticsSubTab === 'insights' && (
                  <div className="space-y-4">
                    <SmartInsightsCard user={user} />
                    <Button 
                      onClick={() => setShowAICoach(true)}
                      className="w-full h-14 nova-gradient text-white font-semibold"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Talk to AI Coach
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating AI Coach Button with Smart Insight Dot */}
      {workoutState === STATES.IDLE && (
        <button
          onClick={() => setShowAICoach(true)}
          className="fixed bottom-24 right-6 z-[100] w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-cyan-500/30 shadow-2xl flex items-center justify-center hover:bg-black/60 transition-all group"
        >
          <Sparkles className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          {/* Smart Insight Notification Dot */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1 right-1 w-2.5 h-2.5 bg-violet-500 rounded-full border border-black shadow-[0_0_12px_rgba(139,92,246,0.8)]"
          />
        </button>
      )}

      {/* Readiness Detail Modal */}
      {showReadinessDetail && (
        <div className="fixed inset-0 bg-black z-[1000] overflow-y-auto pb-24">
          <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <h2 className="text-white font-bold text-lg">Readiness Details</h2>
              <button
                onClick={() => setShowReadinessDetail(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>
          </div>
          <div className="px-4 py-6 max-w-2xl mx-auto">
            <ReadinessGauge user={user} />
          </div>
        </div>
      )}

      {/* AI Coach Modal - Glassmorphic Hub */}
      {showAICoach && (() => {
        const workoutsForReadiness = workouts || [];
        const readinessData = calculateReadiness(workoutsForReadiness);
        const overallStatus = getReadinessStatus(readinessData.overall);
        
        const glowColors = {
          green: 'shadow-[0_0_80px_rgba(34,197,94,0.4)]',
          amber: 'shadow-[0_0_80px_rgba(251,146,60,0.4)]',
          red: 'shadow-[0_0_80px_rgba(239,68,68,0.4)]'
        };

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`w-full max-w-2xl bg-black/60 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] ${glowColors[overallStatus.color]}`}
            >
              {/* Slim Header with Readiness LEDs */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-2 h-2 rounded-full ${
                        readinessData.zones.upper_body >= 85 ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]' :
                        readinessData.zones.upper_body >= 60 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]' :
                        'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      }`}
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      className={`w-2 h-2 rounded-full ${
                        readinessData.zones.lower_body >= 85 ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]' :
                        readinessData.zones.lower_body >= 60 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]' :
                        'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      }`}
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      className={`w-2 h-2 rounded-full ${
                        readinessData.zones.cns >= 85 ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]' :
                        readinessData.zones.cns >= 60 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]' :
                        'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      }`}
                    />
                  </div>
                  <span className="text-white/60 text-xs font-medium">
                    {overallStatus.label} • {readinessData.overall}%
                  </span>
                </div>
                <button
                  onClick={() => setShowAICoach(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <span className="text-white/60 text-lg">×</span>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                <AICoachModule user={user} readinessData={readinessData} overallStatus={overallStatus} />
              </div>

              {/* Floating Input Bar */}
              <div className="p-4 pb-28">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Ask about your training..."
                      className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          // Handle send
                          e.target.value = '';
                        }
                      }}
                    />
                    <button className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center transition-all">
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Workout History Modal */}
      <WorkoutHistoryModal 
        isOpen={showWorkoutHistory} 
        onClose={() => setShowWorkoutHistory(false)}
        user={user}
      />

      {workoutState === STATES.ACTIVE && (
        <>
          {renderModule()}

          {/* Persistent Session Controls */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 pb-24">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowChapterSelector(true)}
                  variant="outline"
                  className="flex-1 h-12 bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                >
                  + Add Discipline
                </Button>
                <Button
                  onClick={handleFinishWorkout}
                  className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white font-bold"
                >
                  Finish Workout
                </Button>
              </div>

              {showChapterSelector && (
                <ChapterSelector
                  onSelect={handleAddChapter}
                  currentChapters={sessionData?.chapters || []}
                  onClose={() => setShowChapterSelector(false)}
                />
              )}
              {sessionData?.chapters && (
                <div className="text-white/40 text-xs text-center">
                  {sessionData.chapters.length} chapter{sessionData.chapters.length !== 1 ? 's' : ''} • 
                  {' '}{Math.round((Date.now() - sessionData.started_at) / 60000)} min total
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {workoutState === STATES.PROOF && (
        <ProofCapture
          sessionData={sessionData}
          onComplete={handleProofComplete}
          onSkip={handleSkipProof}
        />
      )}

      {workoutState === STATES.SUMMARY && (
        <WorkoutSummary
          sessionData={sessionData}
          user={user}
          onReset={handleReset}
        />
      )}
    </div>
  );
}