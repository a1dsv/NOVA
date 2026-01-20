import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function MemoryGallery({ isOpen, onClose, circleId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMedia, setSelectedMedia] = useState(null);

  const { data: proofMessages = [] } = useQuery({
    queryKey: ['challenge-proofs', circleId],
    queryFn: async () => {
      if (!circleId) return [];
      return base44.entities.CircleMessage.filter(
        { circle_id: circleId, type: 'challenge_proof' },
        '-created_date',
        100
      );
    },
    enabled: !!circleId && isOpen,
  });

  // Group by date
  const groupedByDate = proofMessages.reduce((acc, msg) => {
    const date = format(parseISO(msg.created_date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  // Get days for calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen p-4 pb-32">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-black/80 backdrop-blur-xl pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-white font-bold text-xl">Memories</h2>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10"
                >
                  <X className="w-5 h-5 text-white" />
                </Button>
              </div>
              <p className="text-white/40 text-sm mt-1">Challenge victories</p>
            </div>

            {Object.keys(groupedByDate).length === 0 ? (
              <div className="text-center py-20">
                <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">No memories yet</p>
                <p className="text-white/20 text-sm mt-1">Complete challenges to create memories</p>
              </div>
            ) : (
              <>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMonth(subMonths(currentMonth, 1));
                    }}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </Button>
                  <h3 className="text-white font-semibold text-lg">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMonth(addMonths(currentMonth, 1));
                    }}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-zinc-900/50 rounded-2xl p-4">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-white/40 text-xs font-medium py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Days of the month */}
                    {daysInMonth.map(day => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const hasMemories = groupedByDate[dateKey]?.length > 0;
                      const memories = groupedByDate[dateKey] || [];
                      const isToday = isSameDay(day, new Date());
                      const firstMemory = memories[0];
                      const isVideo = firstMemory?.content.includes('.mp4') || firstMemory?.content.includes('.mov') || firstMemory?.content.includes('video');

                      return (
                        <button
                          key={dateKey}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasMemories && memories[0]) {
                              setSelectedMedia(memories[0]);
                            }
                          }}
                          disabled={!hasMemories}
                          className={`aspect-square rounded-xl relative overflow-hidden ${
                            hasMemories 
                              ? 'border-2 border-cyan-500/40 cursor-pointer hover:border-cyan-500' 
                              : 'bg-zinc-800/30 border-2 border-transparent'
                          } ${isToday ? 'ring-2 ring-violet-500' : ''}`}
                        >
                          {hasMemories && firstMemory ? (
                            <>
                              {isVideo ? (
                                <video
                                  src={firstMemory.content}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={firstMemory.content}
                                  alt="Memory"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                              <div className="absolute top-1 left-1">
                                <span className="text-xs font-bold text-white drop-shadow-lg">
                                  {format(day, 'd')}
                                </span>
                              </div>
                              {memories.length > 1 && (
                                <div className="absolute bottom-1 right-1 bg-black/70 rounded-full px-1.5 py-0.5">
                                  <span className="text-[10px] text-cyan-400 font-medium">
                                    +{memories.length - 1}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-medium text-white/40">
                                {format(day, 'd')}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Media Preview Modal */}
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[10001] flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMedia(null);
            }}
          >
            <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMedia(null);
                }}
                size="icon"
                variant="ghost"
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 z-10"
              >
                <X className="w-5 h-5 text-white" />
              </Button>

              {selectedMedia.content.includes('.mp4') || selectedMedia.content.includes('.mov') || selectedMedia.content.includes('video') ? (
                <video
                  src={selectedMedia.content}
                  controls
                  autoPlay
                  className="w-full rounded-2xl bg-black"
                />
              ) : (
                <img
                  src={selectedMedia.content}
                  alt="Memory"
                  className="w-full rounded-2xl"
                />
              )}

              <div className="mt-4 text-center">
                <p className="text-white font-medium">{selectedMedia.sender_name}</p>
                <p className="text-white/60 text-sm">
                  {format(parseISO(selectedMedia.created_date), 'EEEE, MMMM d, yyyy • h:mm a')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}