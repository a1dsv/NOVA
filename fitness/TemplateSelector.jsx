import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TemplateSelector({ onLoadTemplate, onClose, user, allowSwapping = false, currentChapters = [] }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [swapIndex, setSwapIndex] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      const result = await base44.entities.WorkoutTemplate.filter({ user_id: user.id });
      return result;
    },
    enabled: !!user
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WorkoutTemplate.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const handleLoad = () => {
    if (!selectedTemplate) return;

    if (allowSwapping && swapIndex !== null) {
      // Swap a specific component
      onLoadTemplate(selectedTemplate, 'swap', swapIndex);
    } else {
      // Load full template
      onLoadTemplate(selectedTemplate, 'load');
    }
    onClose();
  };

  const getWorkoutTypeLabel = (type) => {
    const labels = {
      martial_arts: 'Combat',
      endurance: 'Endurance',
      strength: 'Strength',
      recovery: 'Recovery',
      hybrid: 'Hybrid'
    };
    return labels[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[250] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 rounded-2xl border border-white/10 p-6 max-w-lg w-full my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">
            {allowSwapping ? 'Swap Component' : 'Load Template'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {allowSwapping && (
          <div className="mb-6">
            <label className="text-white/60 text-sm mb-3 block">Replace Which Component?</label>
            <div className="space-y-2">
              {currentChapters.map((chapter, idx) => (
                <button
                  key={idx}
                  onClick={() => setSwapIndex(idx)}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    swapIndex === idx
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className={`font-semibold text-sm ${
                    swapIndex === idx ? 'text-amber-400' : 'text-white/60'
                  }`}>
                    Component {idx + 1}: {getWorkoutTypeLabel(chapter.type)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="text-white/60 text-sm mb-3 block">Your Templates</label>
            
            {isLoading ? (
              <div className="text-white/40 text-center py-8">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-white/40 text-center py-8">
                No templates yet. Save configurations or completed workouts as templates!
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="flex-1 text-left"
                      >
                        <div className={`font-semibold mb-1 ${
                          selectedTemplate?.id === template.id ? 'text-cyan-400' : 'text-white'
                        }`}>
                          {template.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40">
                            {getWorkoutTypeLabel(template.workout_type)}
                          </span>
                          {template.is_hybrid && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                              {template.chapters?.length || 0} disciplines
                            </span>
                          )}
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Delete this template?')) {
                            deleteTemplateMutation.mutate(template.id);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTemplate && (
            <Button
              onClick={handleLoad}
              disabled={allowSwapping && swapIndex === null}
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
            >
              {allowSwapping ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Swap Component
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Load Template
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}