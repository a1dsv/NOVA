import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Dumbbell, Activity, Target, Swords, Calendar, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import RecoveryJumpChart from '@/components/analytics/RecoveryJumpChart';
import FatigueCorrelationCard from '@/components/analytics/FatigueCorrelationCard';

export default function Analytics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allWorkouts = await base44.entities.Workout.list('-created_date', 200);
      return allWorkouts.filter(w => w.user_id === user.id && w.status === 'finished');
    },
    enabled: !!user,
  });

  // Categorize workouts
  const runWorkouts = workouts.filter(w => w.workout_type === 'run');
  const gymWorkouts = workouts.filter(w => w.workout_type === 'gym');
  const calisthenicsWorkouts = workouts.filter(w => w.workout_type === 'calisthenics');
  const martialArtsWorkouts = workouts.filter(w => w.workout_type === 'martial_arts');

  // Calculate consistency heatmap (last 12 weeks)
  const getConsistencyData = () => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.created_date);
        return workoutDate >= weekStart && workoutDate < weekEnd;
      });
      
      weeks.push({
        week: i === 0 ? 'This Week' : `${i}w ago`,
        count: weekWorkouts.length,
        intensity: weekWorkouts.length === 0 ? 0 : weekWorkouts.length >= 5 ? 100 : (weekWorkouts.length / 5) * 100
      });
    }
    return weeks;
  };

  const consistencyData = getConsistencyData();

  // Workout frequency over time (last 8 weeks)
  const getFrequencyData = () => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.created_date);
        return workoutDate >= weekStart && workoutDate < weekEnd;
      });
      
      weeks.push({
        week: `W${8-i}`,
        count: weekWorkouts.length,
        gym: weekWorkouts.filter(w => w.workout_type === 'gym').length,
        run: weekWorkouts.filter(w => w.workout_type === 'run').length,
        calisthenics: weekWorkouts.filter(w => w.workout_type === 'calisthenics').length,
        martial_arts: weekWorkouts.filter(w => w.workout_type === 'martial_arts').length,
      });
    }
    return weeks;
  };

  // Volume trends (gym workouts only)
  const getVolumeData = () => {
    const gymWorkoutsData = workouts
      .filter(w => w.workout_type === 'gym' && w.total_volume)
      .slice(0, 20)
      .reverse()
      .map((w, idx) => ({
        session: `S${idx + 1}`,
        volume: w.total_volume || 0,
        date: new Date(w.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));
    return gymWorkoutsData;
  };

  // Personal bests progression
  const getPersonalBests = () => {
    const exercises = {};
    workouts
      .filter(w => w.workout_type === 'gym' && w.exercises)
      .forEach(workout => {
        workout.exercises?.forEach(exercise => {
          exercise.set_records?.forEach(set => {
            if (set.weight && set.reps) {
              const key = exercise.name;
              if (!exercises[key] || (set.weight > exercises[key].weight)) {
                exercises[key] = {
                  name: exercise.name,
                  weight: set.weight,
                  reps: set.reps,
                  date: workout.created_date,
                  category: exercise.category
                };
              }
            }
          });
        });
      });
    return Object.values(exercises).sort((a, b) => b.weight - a.weight).slice(0, 10);
  };

  // Muscle group focus (last 30 days)
  const getMuscleGroupData = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const categories = {};
    workouts
      .filter(w => new Date(w.created_date) >= thirtyDaysAgo && w.exercises)
      .forEach(workout => {
        workout.exercises?.forEach(exercise => {
          const cat = exercise.category || 'Other';
          categories[cat] = (categories[cat] || 0) + (exercise.set_records?.length || 0);
        });
      });
    
    return Object.entries(categories)
      .map(([name, sets]) => ({ name, sets }))
      .sort((a, b) => b.sets - a.sets);
  };

  const frequencyData = getFrequencyData();
  const volumeData = getVolumeData();
  const personalBests = getPersonalBests();
  const muscleGroupData = getMuscleGroupData();

  // Calculate balance scores
  const totalWorkouts = workouts.length;
  const strengthScore = totalWorkouts > 0 ? ((gymWorkouts.length + calisthenicsWorkouts.length) / totalWorkouts) * 100 : 0;
  const enduranceScore = totalWorkouts > 0 ? (runWorkouts.length / totalWorkouts) * 100 : 0;
  const skillScore = totalWorkouts > 0 ? (martialArtsWorkouts.length / totalWorkouts) * 100 : 0;



  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header - Slim Utility Style */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold text-white tracking-tight">LAB: ANALYTICS</h1>
            <p className="text-white/40 text-xs uppercase tracking-wider">Multi-Engine Performance Data</p>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Recovery Jump Chart */}
          <RecoveryJumpChart user={user} />

          {/* Fatigue Correlation */}
          <FatigueCorrelationCard user={user} />

          {/* Workout Frequency Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-violet-400" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
              <h3 className="text-white font-bold">Workout Frequency</h3>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 ml-auto text-xs">
                Last 8 Weeks
              </Badge>
            </div>
            
            {frequencyData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="gym" stackId="a" fill="#00f2ff" name="Gym" />
                  <Bar dataKey="run" stackId="a" fill="#ef4444" name="Run" />
                  <Bar dataKey="calisthenics" stackId="a" fill="#10b981" name="Calisthenics" />
                  <Bar dataKey="martial_arts" stackId="a" fill="#8b5cf6" name="Martial Arts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-white/40">
                No workout data yet
              </div>
            )}
          </motion.div>

          {/* Volume Trends */}
          {volumeData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-violet-400" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
                <h3 className="text-white font-bold">Volume Trends</h3>
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 ml-auto text-xs">
                  Last 20 Sessions
                </Badge>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '11px' }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#BC00FF" 
                    strokeWidth={3}
                    fill="url(#volumeGradient)"
                    name="Total Volume (lbs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Personal Bests */}
          {personalBests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-violet-400" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
                <h3 className="text-white font-bold">Personal Bests</h3>
              </div>
              
              <div className="space-y-2">
                {personalBests.map((pb, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-black/30 backdrop-blur-xl rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-white font-bold">{pb.name}</span>
                        <Badge className="ml-2 bg-violet-500/20 border border-violet-500/30 text-violet-400 text-[10px]">
                          {pb.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold font-mono text-violet-400 neon-data">{pb.weight}<span className="text-sm text-white/40">lbs</span></div>
                        <div className="text-white/40 text-xs font-mono">{pb.reps} reps</div>
                      </div>
                    </div>
                    <div className="text-white/30 text-xs font-mono">
                      {new Date(pb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Muscle Group Focus */}
          {muscleGroupData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
            >
              <div className="flex items-center gap-2 mb-6">
                <Dumbbell className="w-5 h-5 text-violet-400" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
                <h3 className="text-white font-bold">Muscle Group Focus</h3>
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 ml-auto text-xs">
                  Last 30 Days
                </Badge>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={muscleGroupData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '11px' }} width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="sets" fill="#BC00FF" name="Total Sets" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Radar Chart - Balance Score */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold">Training Balance</h3>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                Radar View
              </Badge>
            </div>

            <div className="relative w-64 h-64 mx-auto mb-6">
              {/* Simple radar chart representation */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Background circles */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {/* Axes */}
                <line x1="100" y1="100" x2="100" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="100" y1="100" x2="169" y2="139" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="100" y1="100" x2="31" y2="139" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                
                {/* Data polygon */}
                <polygon
                  points={`100,${100 - (strengthScore * 0.8)},${100 + (enduranceScore * 0.69)},${139 - (enduranceScore * 0.39)},${100 - (skillScore * 0.69)},${139 - (skillScore * 0.39)}`}
                  fill="rgba(0,242,255,0.2)"
                  stroke="rgb(0,242,255)"
                  strokeWidth="2"
                />
              </svg>
              
              {/* Labels */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6">
                <div className="text-cyan-400 text-xs font-semibold">Strength</div>
                <div className="text-white text-center">{strengthScore.toFixed(0)}%</div>
              </div>
              <div className="absolute bottom-0 right-0 translate-x-4">
                <div className="text-red-400 text-xs font-semibold">Endurance</div>
                <div className="text-white text-center">{enduranceScore.toFixed(0)}%</div>
              </div>
              <div className="absolute bottom-0 left-0 -translate-x-4">
                <div className="text-violet-400 text-xs font-semibold">Skill</div>
                <div className="text-white text-center">{skillScore.toFixed(0)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <Dumbbell className="w-5 h-5 text-violet-400 mx-auto mb-1" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
                <div className="text-white/60 text-xs uppercase tracking-wider">Strength</div>
                <div className="text-white font-bold font-mono neon-data">{gymWorkouts.length + calisthenicsWorkouts.length}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <Activity className="w-5 h-5 text-violet-400 mx-auto mb-1" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
                <div className="text-white/60 text-xs uppercase tracking-wider">Endurance</div>
                <div className="text-white font-bold font-mono neon-data">{runWorkouts.length}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <Swords className="w-5 h-5 text-violet-400 mx-auto mb-1" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
                <div className="text-white/60 text-xs uppercase tracking-wider">Skill</div>
                <div className="text-white font-bold font-mono neon-data">{martialArtsWorkouts.length}</div>
              </div>
            </div>
          </motion.div>

          {/* Consistency Heatmap */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-violet-400" style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }} />
              <h3 className="text-white font-bold">Consistency Heatmap</h3>
            </div>
            
            <div className="grid grid-cols-6 gap-2">
              {consistencyData.map((week, idx) => (
                <div key={idx} className="text-center">
                  <div 
                    className="aspect-square rounded-lg mb-1 flex items-center justify-center text-xs font-bold"
                    style={{
                      background: week.intensity === 0 
                        ? 'rgba(255,255,255,0.05)'
                        : `linear-gradient(135deg, rgba(0,242,255,${week.intensity / 100}), rgba(143,0,255,${week.intensity / 100}))`
                    }}
                  >
                    {week.count}
                  </div>
                  <div className="text-[9px] text-white/40">{week.week}</div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-4 text-xs">
              <span className="text-white/40">Less Active</span>
              <div className="flex gap-1">
                {[20, 40, 60, 80, 100].map((intensity) => (
                  <div 
                    key={intensity}
                    className="w-4 h-4 rounded"
                    style={{
                      background: `linear-gradient(135deg, rgba(0,242,255,${intensity / 100}), rgba(143,0,255,${intensity / 100}))`
                    }}
                  />
                ))}
              </div>
              <span className="text-white/40">More Active</span>
            </div>
          </motion.div>

          {/* Recent Activity Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]"
          >
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Recent Activity</h3>
            <div className="space-y-2">
              {workouts.slice(0, 10).map((workout, idx) => (
                <motion.div 
                  key={workout.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-black/30 backdrop-blur-xl rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {workout.workout_type === 'run' && <Activity className="w-4 h-4 text-red-400" />}
                    {workout.workout_type === 'gym' && <Dumbbell className="w-4 h-4 text-cyan-400" />}
                    {workout.workout_type === 'calisthenics' && <Target className="w-4 h-4 text-green-400" />}
                    {workout.workout_type === 'martial_arts' && <Swords className="w-4 h-4 text-violet-400" />}
                    <div>
                      <div className="text-white text-sm font-bold capitalize">{workout.workout_type.replace('_', ' ')}</div>
                      <div className="text-white/40 text-xs font-mono">{workout.duration_minutes}min</div>
                    </div>
                  </div>
                  <div className="text-white/60 text-xs font-mono">
                    {new Date(workout.created_date).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
              {workouts.length === 0 && (
                <p className="text-white/40 text-center py-8">No workouts logged yet. Start tracking!</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}