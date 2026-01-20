import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Dumbbell, Swords, Heart, Zap, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function WorkoutHistoryModal({ isOpen, onClose, user }) {
  const [selectedType, setSelectedType] = useState('all');
  const queryClient = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workout-history', user?.id],
    queryFn: async () => {
      const data = await base44.entities.Workout.filter({ user_id: user.id });
      return data.sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at));
    },
    enabled: !!user && isOpen
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (workoutId) => base44.entities.Workout.delete(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workout-history']);
      queryClient.invalidateQueries(['workouts']);
    }
  });

  const handleDeleteWorkout = (workoutId) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      deleteWorkoutMutation.mutate(workoutId);
    }
  };

  const workoutTypes = [
    { id: 'martial_arts', name: 'Combat', icon: Swords, color: 'text-red-400' },
    { id: 'run', name: 'Run', icon: Activity, color: 'text-blue-400' },
    { id: 'strength', name: 'Strength', icon: Dumbbell, color: 'text-purple-400' },
    { id: 'recovery', name: 'Recovery', icon: Heart, color: 'text-green-400' },
    { id: 'hybrid', name: 'Hybrid', icon: Zap, color: 'text-cyan-400' }
  ];

  // Calculate workout distribution for spider chart
  const distribution = workoutTypes.map(type => {
    const count = workouts.filter(w => w.workout_type === type.id).length;
    return {
      type: type.name,
      count,
      fullMark: Math.max(...workoutTypes.map(t => 
        workouts.filter(w => w.workout_type === t.id).length
      ), 10)
    };
  });

  const filteredWorkouts = selectedType === 'all' 
    ? workouts 
    : workouts.filter(w => w.workout_type === selectedType);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-white/10 max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-bold text-lg">Workout History</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Spider Chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Workout Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={distribution}>
                  <PolarGrid stroke="#ffffff20" />
                  <PolarAngleAxis dataKey="type" stroke="#ffffff60" />
                  <PolarRadiusAxis stroke="#ffffff40" />
                  <Radar
                    name="Workouts"
                    dataKey="count"
                    stroke="#00f2ff"
                    fill="#00f2ff"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {workoutTypes.map(type => {
                  const count = workouts.filter(w => w.workout_type === type.id).length;
                  return (
                    <div key={type.id} className="text-center">
                      <div className={`${type.color} text-2xl font-bold`}>{count}</div>
                      <div className="text-white/40 text-xs">{type.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedType === 'all'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                All
              </button>
              {workoutTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      selectedType === type.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.name}
                  </button>
                );
              })}
            </div>

            {/* Workout List */}
            {isLoading ? (
              <div className="text-white/40 text-center py-12">Loading...</div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="text-white/40 text-center py-12">No workouts found</div>
            ) : (
              <div className="space-y-3">
                {filteredWorkouts.map((workout) => {
                  const type = workoutTypes.find(t => t.id === workout.workout_type);
                  const Icon = type?.icon || Activity;
                  
                  return (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`${type?.color} font-semibold`}>{type?.name}</h4>
                            <span className="text-white/40 text-sm">{formatDate(workout.finished_at)}</span>
                          </div>
                          <div className="text-white/60 text-sm">
                            Duration: {formatDuration(workout.duration_minutes)}
                          </div>
                          {workout.session_data && (
                            <div className="text-white/40 text-xs mt-2">
                              {workout.workout_type === 'hybrid' && workout.session_data.chapters && (
                                <span>{workout.session_data.total_chapters} disciplines • Multi-modal session</span>
                              )}
                              {workout.workout_type === 'martial_arts' && workout.session_data.totalRounds && (
                                <span>{workout.session_data.totalRounds} rounds completed</span>
                              )}
                              {workout.workout_type === 'run' && workout.session_data.distance && (
                                <span>{workout.session_data.distance.toFixed(2)} km</span>
                              )}
                              {workout.workout_type === 'strength' && workout.session_data.exercises && (
                                <span>{workout.session_data.exercises.length} exercises</span>
                              )}
                              {workout.workout_type === 'recovery' && workout.session_data.checklist && (
                                <span>{workout.session_data.checklist.filter(c => c.completed).length} activities completed</span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}