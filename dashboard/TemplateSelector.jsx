import React from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TemplateSelector({ templates, onSelectTemplate, onCreateNew }) {
  if (templates.length === 0) {
    return (
      <div className="px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/60 mb-4">No templates yet</p>
          <Button
            onClick={onCreateNew}
            className="nova-gradient"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold">Your Templates</h2>
        <Button
          onClick={onCreateNew}
          size="sm"
          className="nova-gradient h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {templates.map((template) => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-cyan-400/40 transition-all cursor-pointer group"
          onClick={() => onSelectTemplate(template)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">{template.name}</h3>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <span className="capitalize">{template.workout_type.replace('_', ' ')}</span>
                <span>•</span>
                <span>{template.exercises?.length || 0} exercises</span>
              </div>
            </div>
            <Button
              size="icon"
              className="w-10 h-10 rounded-full nova-gradient opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-5 h-5 ml-0.5" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}