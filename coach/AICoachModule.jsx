import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles, Loader2, MessageCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import CoachInsightCard from './CoachInsightCard';
import { calculateReadiness, getReadinessStatus } from '@/components/performanceEngine';

export default function AICoachModule({ user, readinessData, overallStatus }) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const queryClient = useQueryClient();

  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ['recent-workouts-coach', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 7),
    enabled: !!user,
    initialData: []
  });

  const { data: recentMeals = [] } = useQuery({
    queryKey: ['recent-meals-coach', user?.id],
    queryFn: () => base44.entities.Meal.filter({ user_id: user?.id }, '-created_date', 7),
    enabled: !!user,
    initialData: []
  });

  const askCoachMutation = useMutation({
    mutationFn: async (question) => {
      // Build detailed workout context with fatigue profiles
      const workoutContext = recentWorkouts.map(w => {
        const type = w.workout_type;
        const date = new Date(w.created_date).toLocaleDateString();
        const duration = w.duration_minutes || 0;
        
        // Extract chapter data for hybrid workouts
        const chapters = w.session_data?.chapters || [];
        const chapterTypes = chapters.map(ch => ch.type).join(', ');
        
        let fatigueProfile = '';
        if (type === 'martial_arts' || chapterTypes.includes('martial_arts')) {
          fatigueProfile = ' [HIGH CNS LOAD - sparring/combat work]';
        } else if (type === 'strength' || chapterTypes.includes('strength')) {
          fatigueProfile = ' [METABOLIC STRESS - strength training]';
        } else if (type === 'endurance' || chapterTypes.includes('endurance')) {
          fatigueProfile = ' [METABOLIC STRESS - cardio/endurance]';
        } else if (type === 'recovery' || chapterTypes.includes('recovery')) {
          fatigueProfile = ' [RECOVERY - low intensity]';
        }
        
        const workoutDesc = type === 'hybrid' 
          ? `Hybrid (${chapterTypes})` 
          : type.replace('_', ' ');
        
        return `- ${workoutDesc} on ${date}, ${duration}min${fatigueProfile}`;
      }).join('\n');

      const mealContext = recentMeals.map(m => 
        `- ${m.meal_type}: ${m.total_calories}cal (P:${m.total_protein}g, C:${m.total_carbs}g, F:${m.total_fat}g) on ${new Date(m.meal_date).toLocaleDateString()}`
      ).join('\n');

      // Build readiness context
      const readinessContext = `
CURRENT READINESS SCORES (Performance Engine):
- Overall Readiness: ${readinessData.overall}% (${overallStatus.label})
- Upper Body: ${Math.round(readinessData.zones.upper_body)}% (${getReadinessStatus(readinessData.zones.upper_body).label})
- Lower Body: ${Math.round(readinessData.zones.lower_body)}% (${getReadinessStatus(readinessData.zones.lower_body).label})
- CNS/Systemic: ${Math.round(readinessData.zones.cns)}% (${getReadinessStatus(readinessData.zones.cns).label})

RECOVERY MULTIPLIERS ACTIVE:
${readinessData.recovery_boosts.upper_body > 1 ? `- Upper Body: ${readinessData.recovery_boosts.upper_body.toFixed(1)}x (Ice bath/sauna active)` : ''}
${readinessData.recovery_boosts.lower_body > 1 ? `- Lower Body: ${readinessData.recovery_boosts.lower_body.toFixed(1)}x (Ice bath/sauna active)` : ''}
${readinessData.recovery_boosts.cns > 1 ? `- CNS: ${readinessData.recovery_boosts.cns.toFixed(1)}x (Sauna active)` : ''}
${readinessData.recovery_boosts.upper_body === 1 && readinessData.recovery_boosts.lower_body === 1 && readinessData.recovery_boosts.cns === 1 ? '- No active recovery multipliers' : ''}

READINESS INSIGHTS:
${readinessData.recommendations.map(rec => `- ${rec.message}`).join('\n') || '- All systems operating normally'}
`;

      const context = `
${readinessContext}

RECENT WORKOUTS (last 7 days):
${workoutContext || 'No workouts logged yet'}

RECENT MEALS (last 7 days):
${mealContext || 'No meals logged yet'}

USER QUESTION: ${question}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite fitness and nutrition AI coach with full access to the NOVA Performance Engine - a sophisticated fatigue tracking system.

PERFORMANCE ENGINE - FATIGUE MATRIX:
The app tracks THREE recovery zones:
1. UPPER BODY (chest, back, shoulders, arms) - Recovers at ~4.5% per hour
2. LOWER BODY (legs, glutes, calves) - Recovers at ~3.8% per hour  
3. CNS/SYSTEMIC (central nervous system, coordination) - Recovers at ~3.2% per hour (slowest)

WORKOUT FATIGUE PROFILES:
- Boxing: Upper Body 85%, Lower Body 20%, CNS 90% (HIGH nervous system load)
- Muay Thai: Upper Body 80%, Lower Body 85%, CNS 95% (EXTREME CNS fatigue)
- Chest/Strength: Upper Body 90%, Lower Body 0%, CNS 40% (localized stress)
- Running: Upper Body 10%, Lower Body 85%, CNS 40% (cardiovascular)

RECOVERY ACCELERATORS (Active Boosts):
- Ice Bath: 2.0x recovery for Upper & Lower Body (24h duration) - targets muscles used in last 24h
- Sauna: 1.8x recovery for ALL zones including CNS (48h duration) - systemic blood flow boost
- Stretching: 1.3x recovery for Upper & Lower Body (12h duration)

FRESH ZONE LOGIC:
The Performance Engine ensures at least ONE muscle group stays above 85% readiness to prevent overtraining. 
If Upper Body is fatigued but Lower Body is Prime (90%+), suggest leg work. If CNS is fatigued, avoid sparring/combat entirely.

CONTEXT YOU HAVE:
${context}

YOUR COACHING APPROACH:
1. ALWAYS check the Current Readiness Scores first
2. If user asks "What should I do?" - analyze the Fatigue Matrix and suggest workouts that target Fresh Zones
3. Example: "Your upper body is 65% (fatigued from Muay Thai yesterday), but your lower body is 90% recovered. Perfect time for a leg-focused strength session or endurance run."
4. Warn against high-CNS work (sparring, boxing) if CNS is below 60%
5. Recommend recovery interventions (ice bath, sauna) if multiple zones are fatigued
6. If recovery multipliers are active, mention they're accelerating recovery
7. Give specific, actionable advice based on ACTUAL readiness scores

Keep responses concise, data-driven, and motivating. Reference specific readiness percentages in your advice.`
      });

      return response;
    }
  });

  const quickPrompts = [
    "What should I do today?",
    "Am I recovering properly?",
    "Should I do a recovery session?",
    "Analyze my readiness scores"
  ];

  const handleAsk = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    
    const question = input;
    setInput('');
    
    // Get coach response
    const response = await askCoachMutation.mutateAsync(question);
    
    // Add coach message
    const coachMessage = { role: 'coach', content: response, timestamp: Date.now() };
    setMessages(prev => [...prev, coachMessage]);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Ask Coach
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'insights'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Smart Insights
        </button>
      </div>

      {activeTab === 'insights' ? (
        <CoachInsightCard user={user} readinessData={readinessData} overallStatus={overallStatus} />
      ) : (
        <>
          {/* Messages Container */}
          <div className="space-y-4 mb-6 min-h-[400px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">AI Performance Coach</h3>
                <p className="text-white/60 text-sm mb-6 max-w-xs">
                  Ask me anything about your training, recovery, or nutrition
                </p>
                
                {/* Quick Prompts */}
                <div className="space-y-2 w-full">
                  {quickPrompts.map((prompt, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={async () => {
                        const userMessage = { role: 'user', content: prompt, timestamp: Date.now() };
                        setMessages([userMessage]);
                        const response = await askCoachMutation.mutateAsync(prompt);
                        const coachMessage = { role: 'coach', content: response, timestamp: Date.now() };
                        setMessages(prev => [...prev, coachMessage]);
                      }}
                      disabled={askCoachMutation.isPending}
                      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-lg p-3 transition-all"
                    >
                      <p className="text-white/80 text-sm">{prompt}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="max-w-[85%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-white text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[90%] bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap font-light">
                          {msg.content.split(/(\d+%|\d+\.\d+x|\d+ lbs|\d+ km|\d+ min)/).map((part, i) => {
                            if (/\d+%|\d+\.\d+x|\d+ lbs|\d+ km|\d+ min/.test(part)) {
                              return <span key={i} className="font-mono font-bold text-cyan-400">{part}</span>;
                            }
                            return part;
                          })}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {askCoachMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-white/60 text-sm">Analyzing your data...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}