import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdaptiveCoachSuggestion({ 
  suggestion, 
  onAccept, 
  onDecline 
}) {
  if (!suggestion) return null;

  const typeConfig = {
    scale_back: {
      icon: AlertTriangle,
      bg: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      title: 'Adaptive Scaling Recommended'
    },
    swap_workout: {
      icon: Lightbulb,
      bg: 'from-cyan-500/10 to-blue-500/10',
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      title: 'Smart Workout Swap'
    }
  };

  const config = typeConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 p-6"
      >
        <div className={`bg-gradient-to-br ${config.bg} border ${config.border} rounded-xl p-4 mb-6`}>
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold mb-2">{config.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {suggestion.message}
              </p>
            </div>
          </div>
        </div>

        {suggestion.modifiedConfig && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <h4 className="text-white font-semibold text-sm mb-3">Adjusted Plan</h4>
            <div className="space-y-2">
              {suggestion.changes.map((change, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-white/80">{change}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={onAccept}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
          >
            Accept Suggestion
          </Button>
          <Button
            onClick={onDecline}
            variant="outline"
            className="w-full h-12 bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
          >
            Continue with Original Plan
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}