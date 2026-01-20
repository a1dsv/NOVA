import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ProgressiveOverloadSuggestion({ exercise, userId, onApplySuggestion }) {
  const [expanded, setExpanded] = useState(false);
  
  const { data: suggestion, isLoading } = useQuery({
    queryKey: ['overload-suggestion', exercise.name, userId],
    queryFn: async () => {
      // Get workout history
      const workouts = await base44.entities.Workout.filter({ user_id: userId }, '-created_date', 20);
      
      // Filter workouts with this exercise
      const relevantWorkouts = workouts
        .filter(w => w.exercises?.some(ex => ex.name.toLowerCase() === exercise.name.toLowerCase()))
        .slice(0, 5);
      
      if (relevantWorkouts.length === 0) {
        return { recommendation: "First time doing this exercise! Start with a comfortable weight and focus on form." };
      }
      
      // Extract historical data
      const history = relevantWorkouts.map(w => {
        const ex = w.exercises.find(e => e.name.toLowerCase() === exercise.name.toLowerCase());
        return {
          date: w.created_date,
          sets: ex.set_records?.filter(s => s.completed).length || 0,
          max_weight: Math.max(...(ex.set_records?.map(s => s.weight || 0) || [0])),
          avg_reps: ex.set_records?.reduce((sum, s) => sum + (s.reps || 0), 0) / (ex.set_records?.length || 1),
          avg_rpe: ex.set_records?.reduce((sum, s) => sum + (s.rpe || 0), 0) / (ex.set_records?.length || 1)
        };
      });
      
      // Call AI for recommendation
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strength training coach analyzing progressive overload for "${exercise.name}".

RECENT PERFORMANCE (last 5 sessions):
${history.map((h, i) => `Session ${i + 1}: ${h.sets} sets, Max weight: ${h.max_weight} lbs, Avg reps: ${h.avg_reps.toFixed(1)}, Avg RPE: ${h.avg_rpe.toFixed(1)}/10`).join('\n')}

CURRENT SESSION:
- Planned sets: ${exercise.set_records?.length || 0}
- Last max weight: ${history[0]?.max_weight || 0} lbs
- Last avg reps: ${history[0]?.avg_reps?.toFixed(1) || 0}
- Last avg RPE: ${history[0]?.avg_rpe?.toFixed(1) || 0}/10

Provide a specific progressive overload recommendation for THIS session:
1. Should they increase weight? By how much?
2. Should they increase reps? By how many?
3. How many sets?
4. Target RPE range?
5. Brief reasoning (1 sentence)

Be conservative and safe. Progressive overload should be gradual.`,
        response_json_schema: {
          type: "object",
          properties: {
            target_weight: { type: "number" },
            target_reps: { type: "number" },
            target_sets: { type: "number" },
            target_rpe: { type: "number" },
            recommendation: { type: "string" },
            reasoning: { type: "string" }
          },
          required: ["recommendation"]
        }
      });
      
      return response;
    },
    enabled: !!userId && !!exercise.name,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-white/40 text-sm py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Analyzing performance...</span>
      </div>
    );
  }
  
  if (!suggestion) return null;
  
  const hasTargets = suggestion.target_weight || suggestion.target_reps;
  
  return (
    <div className="mt-2 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-white font-medium text-sm">AI Overload Suggestion</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-white/80 text-sm">{suggestion.recommendation}</p>
              
              {hasTargets && (
                <div className="grid grid-cols-2 gap-2">
                  {suggestion.target_weight && (
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-xs">Target Weight</p>
                      <p className="text-cyan-400 font-bold">{suggestion.target_weight} lbs</p>
                    </div>
                  )}
                  {suggestion.target_reps && (
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-xs">Target Reps</p>
                      <p className="text-violet-400 font-bold">{suggestion.target_reps}</p>
                    </div>
                  )}
                  {suggestion.target_sets && (
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-xs">Target Sets</p>
                      <p className="text-green-400 font-bold">{suggestion.target_sets}</p>
                    </div>
                  )}
                  {suggestion.target_rpe && (
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-xs">Target RPE</p>
                      <p className="text-amber-400 font-bold">{suggestion.target_rpe}/10</p>
                    </div>
                  )}
                </div>
              )}
              
              {suggestion.reasoning && (
                <p className="text-white/60 text-xs italic">{suggestion.reasoning}</p>
              )}
              
              {hasTargets && onApplySuggestion && (
                <button
                  onClick={() => onApplySuggestion(suggestion)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Apply Suggestion
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}