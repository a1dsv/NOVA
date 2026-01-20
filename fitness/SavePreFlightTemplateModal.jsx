import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function SavePreFlightTemplateModal({ workoutType, config, user, onClose }) {
  const [templateName, setTemplateName] = useState('');
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      return await base44.entities.WorkoutTemplate.create(templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSaved(true);
      setTimeout(() => onClose(), 1500);
    }
  });

  const handleSave = () => {
    if (!templateName.trim()) return;

    saveTemplateMutation.mutate({
      user_id: user.id,
      name: templateName,
      workout_type: workoutType.id,
      is_hybrid: false,
      config: config
    });
  };

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-zinc-900 rounded-2xl border border-green-500/30 p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-white font-bold text-xl mb-2">Template Saved!</h3>
          <p className="text-white/60 text-sm">You can now load this configuration anytime</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 rounded-2xl border border-white/10 p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">Save Configuration</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-white/60 text-sm mb-2 block">Template Name</label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={`e.g., My ${workoutType.name} Setup`}
              className="bg-black/30 border-white/10 text-white"
            />
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="text-cyan-400 text-xs">
              ℹ️ This saves your current configuration settings for quick loading later
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!templateName.trim() || saveTemplateMutation.isPending}
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}