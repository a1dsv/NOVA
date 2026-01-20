import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Activity, Target, Swords, CheckCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function WorkoutHistoryCard({ workout, index }) {
  const queryClient = useQueryClient();

  const deleteWorkoutMutation = useMutation({
    mutationFn: async () => {
      return base44.functions.invoke('deleteWorkout', { workoutId: workout.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['finished-workouts']);
      queryClient.invalidateQueries(['workouts']);
    }
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this workout?')) {
      deleteWorkoutMutation.mutate();
    }
  };

  const icons = {
    gym: Dumbbell,
    calisthenics: Target,
    run: Activity,
    martial_arts: Swords
  };

  const colors = {
    gym: 'cyan',
    calisthenics: 'green',
    run: 'red',
    martial_arts: 'violet'
  };

  const Icon = icons[workout.workout_type] || Dumbbell;
  const color = colors[workout.workout_type] || 'cyan';

  const completedSets = workout.exercises?.reduce((total, ex) => {
    return total + (ex.set_records?.filter(s => s.completed).length || 0);
  }, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          <div>
            <h3 className="text-white font-semibold capitalize">
              {workout.template_name || workout.workout_type.replace('_', ' ')}
            </h3>
            <p className="text-white/40 text-xs">
              {format(new Date(workout.finished_at || workout.created_date), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <button
            onClick={handleDelete}
            disabled={deleteWorkoutMutation.isPending}
            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors group"
          >
            <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-white/40 text-[10px] uppercase mb-1">Duration</div>
          <div className="text-white font-semibold">{workout.duration_minutes || 0}m</div>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-white/40 text-[10px] uppercase mb-1">Exercises</div>
          <div className="text-white font-semibold">{workout.exercises?.length || 0}</div>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-white/40 text-[10px] uppercase mb-1">Sets</div>
          <div className="text-white font-semibold">{completedSets}</div>
        </div>
      </div>

      {workout.total_volume > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="text-white/40 text-xs">Total Volume</div>
          <div className={`text-${color}-400 font-bold`}>{workout.total_volume.toLocaleString()} lbs</div>
        </div>
      )}

      {workout.ai_suggestions && workout.ai_suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
              <span className="text-[10px]">✨</span>
            </div>
            <div className="text-white/60 text-xs font-medium">AI Suggestions Applied</div>
          </div>
          <div className="text-white/40 text-xs">
            {workout.ai_suggestions.slice(0, 2).join(' • ')}
          </div>
        </div>
      )}
    </motion.div>
  );
}