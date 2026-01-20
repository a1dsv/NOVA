import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Zap, Dumbbell, Activity, Target, Swords, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExerciseLibraryBrowser from '@/components/fitness/ExerciseLibraryBrowser';
import ConditionSelector from '@/components/fitness/ConditionSelector';
import ProtocolSelector from '@/components/fitness/ProtocolSelector';

export default function StartSessionModal({ isOpen, onClose, templates, onStartTemplate, onStartBlank }) {
  const [step, setStep] = useState('menu'); // menu, protocol, type, library, condition
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedType, setSelectedType] = useState('gym');
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [condition, setCondition] = useState('fresh');

  const workoutTypes = [
    { id: 'gym', name: 'Gym', icon: Dumbbell, color: 'cyan' },
    { id: 'calisthenics', name: 'Calisthenics', icon: Target, color: 'green' },
    { id: 'run', name: 'Running', icon: Activity, color: 'red' },
    { id: 'martial_arts', name: 'Martial Arts', icon: Swords, color: 'violet' },
    { id: 'recovery', name: 'Recovery', icon: Activity, color: 'blue' }
  ];

  const handleExerciseToggle = (exercise) => {
    const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter(ex => ex.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleStartWorkout = () => {
    const exercises = selectedProtocol === 'strength' 
      ? selectedExercises.map(ex => ({
          name: ex.title,
          category: ex.category,
          description: ex.description,
          rest_seconds: 90,
          load_type: 'bodyweight',
          load_value: 0,
          set_records: [{ reps: 0, weight: 0, completed: false }]
        }))
      : [];

    onStartBlank(selectedType, { 
      exercises, 
      condition, 
      protocol: selectedProtocol,
      is_multimodal: true
    });
    onClose();
    
    // Reset state
    setStep('menu');
    setSelectedProtocol(null);
    setSelectedExercises([]);
    setCondition('fresh');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
            <h2 className="text-white font-bold text-lg">Start Workout</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5"
            >
              <X className="w-5 h-5 text-white/60" />
            </Button>
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {step === 'menu' && !showTemplates && (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowTemplates(true)}
                  className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-white justify-start px-6"
                >
                  <Play className="w-5 h-5 mr-3 text-cyan-400" />
                  <div className="text-left">
                    <div className="font-semibold">Use Template</div>
                    <div className="text-xs text-white/40">{templates.length} saved templates</div>
                  </div>
                </Button>

                <div className="text-center text-white/40 text-sm py-2">or</div>

                <Button
                  onClick={() => setStep('protocol')}
                  className="w-full h-14 nova-gradient text-white font-semibold"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Custom Workout
                </Button>
              </div>
            )}

            {step === 'menu' && showTemplates && (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowTemplates(false)}
                  variant="ghost"
                  className="mb-2 text-white/60 hover:text-white"
                >
                  ← Back
                </Button>

                {templates.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    No templates yet. Start a fresh workout first!
                  </div>
                ) : (
                  templates.map((template) => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onStartTemplate(template);
                        onClose();
                      }}
                      className="w-full text-left bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 hover:border-cyan-400/40 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-semibold mb-1">{template.name}</div>
                          <div className="text-white/40 text-xs capitalize">
                            {template.workout_type.replace('_', ' ')} • {template.exercises?.length || 0} exercises
                          </div>
                        </div>
                        <Play className="w-5 h-5 text-cyan-400" />
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            )}

            {step === 'protocol' && (
              <ProtocolSelector
                onSelect={(protocol) => {
                  setSelectedProtocol(protocol);
                  if (protocol === 'strength') {
                    setStep('library');
                  } else {
                    setStep('condition');
                  }
                }}
                onBack={() => setStep('menu')}
              />
            )}

            {step === 'library' && (
              <div className="space-y-4">
                <Button
                  onClick={() => setStep('protocol')}
                  variant="ghost"
                  className="mb-2 text-white/60 hover:text-white"
                >
                  ← Back
                </Button>

                <ExerciseLibraryBrowser
                  onSelect={handleExerciseToggle}
                  selectedExercises={selectedExercises}
                />

                {selectedExercises.length > 0 && (
                  <Button
                    onClick={() => setStep('condition')}
                    className="w-full nova-gradient h-12 sticky bottom-0"
                  >
                    Continue with {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            )}

            {step === 'condition' && (
              <div className="space-y-4">
                <Button
                  onClick={() => setStep(selectedProtocol === 'strength' ? 'library' : 'protocol')}
                  variant="ghost"
                  className="mb-2 text-white/60 hover:text-white"
                >
                  ← Back
                </Button>

                <ConditionSelector value={condition} onChange={setCondition} />

                <Button
                  onClick={handleStartWorkout}
                  className="w-full nova-gradient h-14"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Workout
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}