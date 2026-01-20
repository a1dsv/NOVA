import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActiveSessionCard from '@/components/dashboard/ActiveSessionCard';

export default function StrengthHUD({ workout, onUpdate, onAddExercise, onFinish }) {
  const handleExerciseUpdate = (updatedExercise) => {
    const updatedExercises = workout.exercises.map(ex =>
      ex.name === updatedExercise.name ? updatedExercise : ex
    );
    onUpdate({ ...workout, exercises: updatedExercises });
  };

  const handleAddSet = (exercise) => {
    const updatedExercise = {
      ...exercise,
      set_records: [
        ...exercise.set_records,
        { reps: 0, weight: 0, rpe: 0, completed: false }
      ]
    };
    handleExerciseUpdate(updatedExercise);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <h2 className="text-white font-bold text-2xl mb-6">Strength Training</h2>

        {workout.exercises?.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-white/40">No exercises yet</div>
            <Button
              onClick={onAddExercise}
              className="nova-gradient h-14 px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Exercise
            </Button>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {workout.exercises?.map((exercise, idx) => (
                <ActiveSessionCard
                  key={idx}
                  exercise={exercise}
                  onUpdate={handleExerciseUpdate}
                  onAddSet={() => handleAddSet(exercise)}
                />
              ))}
            </AnimatePresence>

            <Button
              onClick={onAddExercise}
              variant="ghost"
              className="w-full h-12 border border-dashed border-white/20 hover:border-cyan-400/40 text-white/60 hover:text-cyan-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </>
        )}

        <Button
          onClick={onFinish}
          className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold"
        >
          Finish Workout
        </Button>
      </div>
    </div>
  );
}