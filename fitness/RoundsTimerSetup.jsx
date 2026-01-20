import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FOCUS_OPTIONS = [
  'Jabs',
  'Crosses',
  'Hooks',
  'Uppercuts',
  'Combinations',
  'Footwork',
  'Head Movement',
  'Body Shots',
  'Clinch Work',
  'Sparring',
  'Defense',
  'Counter Striking'
];

export default function RoundsTimerSetup({ onStart }) {
  const [numRounds, setNumRounds] = useState(5);
  const [roundDuration, setRoundDuration] = useState(3); // minutes
  const [restDuration, setRestDuration] = useState(60); // seconds
  const [roundFocuses, setRoundFocuses] = useState({});

  const handleFocusChange = (roundIndex, focus) => {
    setRoundFocuses({
      ...roundFocuses,
      [roundIndex]: focus
    });
  };

  const handleStart = () => {
    const config = {
      numRounds,
      roundDuration: roundDuration * 60, // convert to seconds
      restDuration,
      roundFocuses
    };
    onStart(config);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900/40 to-black p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-white font-bold text-3xl mb-2">Round Timer Setup</h1>
          <p className="text-white/60">Configure your combat training session</p>
        </div>

        {/* Basic Config */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Number of Rounds</label>
            <Input
              type="number"
              min="1"
              max="20"
              value={numRounds}
              onChange={(e) => setNumRounds(parseInt(e.target.value) || 1)}
              className="bg-black/30 border-white/10 text-white text-lg h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Round Duration (min)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={roundDuration}
                onChange={(e) => setRoundDuration(parseInt(e.target.value) || 1)}
                className="bg-black/30 border-white/10 text-white text-lg h-12"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Rest Duration (sec)</label>
              <Input
                type="number"
                min="10"
                max="180"
                value={restDuration}
                onChange={(e) => setRestDuration(parseInt(e.target.value) || 10)}
                className="bg-black/30 border-white/10 text-white text-lg h-12"
              />
            </div>
          </div>
        </div>

        {/* Focus Assignment */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-bold text-lg mb-4">Round Focus (Optional)</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Array.from({ length: numRounds }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="text-white/60 font-medium w-20">Round {idx + 1}</div>
                <Select
                  value={roundFocuses[idx] || ''}
                  onValueChange={(value) => handleFocusChange(idx, value)}
                >
                  <SelectTrigger className="flex-1 bg-black/30 border-white/10 text-white h-10">
                    <SelectValue placeholder="Select focus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FOCUS_OPTIONS.map(focus => (
                      <SelectItem key={focus} value={focus}>
                        {focus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roundFocuses[idx] && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleFocusChange(idx, '')}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl p-6 border border-red-500/30">
          <div className="text-white/80 text-sm space-y-2">
            <div>Total Duration: {Math.ceil((numRounds * roundDuration) + ((numRounds - 1) * restDuration / 60))} minutes</div>
            <div>Work Time: {numRounds * roundDuration} minutes</div>
            <div>Rest Time: {Math.floor((numRounds - 1) * restDuration / 60)} minutes</div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          className="w-full h-16 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg"
        >
          <Play className="w-6 h-6 mr-2" />
          START SESSION
        </Button>
      </div>
    </div>
  );
}