import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Mic, MicOff, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartMealParser({ onParsed }) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          return; // Don't stop for these errors
        }
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        isListeningRef.current = false;
        toast.error('Speech recognition error');
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still in listening mode (using ref to avoid stale closure)
        if (isListeningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.log('Recognition restart failed:', err);
          }
        }
      };
    }
    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      isListeningRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Listening... Describe your meal');
    }
  };

  const handleParse = async () => {
    if (!input.trim()) return;
    
    setParsing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Parse this meal description and extract nutrition data. Handle quantities, weights, and vague descriptions intelligently.

Instructions:
- Extract weight in grams from descriptions like "100g chicken" or "2 oz rice"
- For count descriptions like "2 chicken breasts", estimate typical weight per item
- For vague descriptions like "handful of nuts" or "bowl of rice", lookup the average weight for that specific food item
- A handful of nuts is different from a handful of broccoli - use food-specific average weights
- Return accurate calorie, protein, carbs, fat, and fiber data
- Identify if each item is plant-based (fruit, vegetable, nut, seed, legume, grain, mushroom)
- Always provide weight_grams estimation, never leave it null

Meal description: "${input}"

Return structured nutrition data.`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  weight_grams: { type: "number" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  fiber: { type: "number" },
                  is_plant_based: { type: "boolean" }
                }
              }
            },
            total_calories: { type: "number" },
            total_protein: { type: "number" },
            total_carbs: { type: "number" },
            total_fat: { type: "number" },
            total_fiber: { type: "number" }
          }
        }
      });

      onParsed(result);
      setInput('');
    } catch (error) {
      console.error('Parse error:', error);
      alert('Failed to parse meal. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-2xl border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.12) 50%, rgba(8, 145, 178, 0.1) 100%)',
        boxShadow: 'inset 0 0 30px rgba(6, 182, 212, 0.12), 0 0 20px rgba(16, 185, 129, 0.08)'
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: 'var(--nova-accent)' }} />
        <span className="text-white font-semibold text-sm">Smart Search</span>
      </div>

      <div className="relative mb-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or speak: 100g chicken breast, 2 eggs, handful of almonds..."
          className="bg-black/30 border-[var(--nova-glass-border)] text-white min-h-[80px]"
          disabled={isListening || parsing}
        />
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-xl rounded-full px-2.5 py-1.5 border border-[var(--nova-glass-border)]"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: 'var(--nova-accent)',
                  boxShadow: '0 0 10px var(--nova-accent-glow)'
                }}
              />
              <motion.span 
                className="text-xs font-medium"
                style={{ color: 'var(--nova-accent)' }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Recording...
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isListening ? (
        <Button
          onClick={toggleListening}
          className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          <MicOff className="w-5 h-5 mr-2" />
          Stop Recording
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={toggleListening}
            disabled={parsing}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-[var(--nova-glass-border)]"
          >
            <Mic className="w-4 h-4 mr-2" />
            Voice
          </Button>
          <Button
            onClick={handleParse}
            disabled={parsing || !input.trim()}
            className="flex-1 font-semibold"
            style={{
              background: 'var(--nova-accent)',
              boxShadow: '0 0 20px var(--nova-accent-glow)'
            }}
          >
            {parsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting Nutrition...
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 mr-2" />
                Log to Quest
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}