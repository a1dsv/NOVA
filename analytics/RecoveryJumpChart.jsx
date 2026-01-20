import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateReadiness } from '@/components/performanceEngine';
import { format } from 'date-fns';
import { Droplets, Flame } from 'lucide-react';

export default function RecoveryJumpChart({ user }) {
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts-recovery-chart', user?.id],
    queryFn: () => base44.entities.Workout.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  // Generate daily readiness scores
  const generateTimelineData = () => {
    const today = new Date();
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const timeline = [];
    const recoveryEvents = [];

    // Generate data points for each day
    for (let d = new Date(fourteenDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const currentDate = new Date(d);
      
      // Get workouts up to this date
      const workoutsUpToDate = workouts.filter(w => 
        new Date(w.created_date) <= currentDate
      );
      
      const readinessData = calculateReadiness(workoutsUpToDate);
      
      timeline.push({
        date: dateStr,
        readiness: readinessData.overall,
        timestamp: currentDate.getTime()
      });

      // Check for recovery events on this day
      const dayWorkouts = workouts.filter(w => {
        const wDate = new Date(w.created_date);
        return format(wDate, 'yyyy-MM-dd') === dateStr;
      });

      dayWorkouts.forEach(workout => {
        if (workout.workout_type === 'recovery' && workout.session_data?.chapters) {
          workout.session_data.chapters.forEach(chapter => {
            if (chapter.type === 'recovery') {
              const rounds = chapter.config?.rounds || [];
              rounds.forEach(round => {
                if (round.type === 'cold' || round.type === 'heat') {
                  recoveryEvents.push({
                    date: dateStr,
                    readiness: readinessData.overall,
                    type: round.type,
                    timestamp: currentDate.getTime()
                  });
                }
              });
            }
          });
        }
      });
    }

    return { timeline, recoveryEvents };
  };

  const { timeline, recoveryEvents } = generateTimelineData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-white/20 rounded-lg p-3">
          <p className="text-white font-semibold">{format(new Date(payload[0].payload.timestamp), 'MMM dd')}</p>
          <p className="text-cyan-400 text-sm">Readiness: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-white font-bold text-lg mb-1">Recovery Jump Timeline</h3>
        <p className="text-white/60 text-sm">14-day readiness with recovery interventions</p>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span className="text-white/60 text-xs">Ice Bath</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span className="text-white/60 text-xs">Sauna</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis 
            dataKey="date" 
            stroke="#ffffff40"
            tick={{ fill: '#ffffff60', fontSize: 11 }}
            tickFormatter={(value) => format(new Date(value), 'MM/dd')}
          />
          <YAxis 
            stroke="#ffffff40"
            tick={{ fill: '#ffffff60', fontSize: 11 }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="readiness" 
            stroke="#06b6d4" 
            strokeWidth={3}
            dot={{ fill: '#06b6d4', r: 4 }}
          />
          
          {/* Recovery Event Markers */}
          {recoveryEvents.map((event, idx) => (
            <ReferenceDot
              key={idx}
              x={event.date}
              y={event.readiness}
              r={8}
              fill={event.type === 'cold' ? '#06b6d4' : '#fb923c'}
              stroke={event.type === 'cold' ? '#0891b2' : '#f97316'}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {recoveryEvents.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Recent Recovery Events</h4>
          {recoveryEvents.slice(-5).reverse().map((event, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {event.type === 'cold' ? (
                <Droplets className="w-4 h-4 text-cyan-400" />
              ) : (
                <Flame className="w-4 h-4 text-orange-400" />
              )}
              <span className="text-white/80">
                {format(new Date(event.timestamp), 'MMM dd')} - {event.type === 'cold' ? 'Ice Bath' : 'Sauna'}
              </span>
              <span className="ml-auto text-cyan-400 font-semibold">{event.readiness}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}