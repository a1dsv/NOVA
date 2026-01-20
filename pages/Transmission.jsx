import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, Moon, Sliders, List, Map as MapIcon, Plus, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import SignalListCard from '@/components/transmission/SignalListCard';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import SignalCard from '@/components/pulse/SignalCard';
import { createSignalMarkerIcon } from '@/components/transmission/SignalMapMarker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';



// Map recenter component
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function Transmission() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('map');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [userLocation, setUserLocation] = useState([40.7128, -74.0060]); // Default NYC
  const [filters, setFilters] = useState({
    type: 'all',
    timeRange: 'all',
    maxDistance: 50,
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (!isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null) {
            setUserLocation([lat, lng]);
          }
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  }, []);

  // Function to recenter to user location
  const recenterToUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (!isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null) {
            setUserLocation([lat, lng]);
          }
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  };

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['signals-list', filters],
    queryFn: async () => {
      const query = { status: 'active' };
      if (filters.type !== 'all') {
        query.type = filters.type;
      }
      return base44.entities.Signal.list('-event_time', 50);
    }
  });

  // Fetch host users for trust indicators
  const { data: hostUsers = {} } = useQuery({
    queryKey: ['signal-hosts', signals.map(s => s.host_id)],
    queryFn: async () => {
      const hostIds = [...new Set(signals.map(s => s.host_id))];
      if (hostIds.length === 0) return {};
      
      const response = await base44.functions.invoke('getUsersByIds', { userIds: hostIds });
      const users = response.data?.users || [];
      
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
      });
      return userMap;
    },
    enabled: signals.length > 0,
  });

  const filteredSignals = signals.filter(signal => {
    if (filters.timeRange === 'today') {
      const signalDate = new Date(signal.event_time);
      const today = new Date();
      return signalDate.toDateString() === today.toDateString();
    }
    if (filters.timeRange === 'week') {
      const signalDate = new Date(signal.event_time);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return signalDate <= weekFromNow;
    }
    return true;
  });

  const handleSignalClick = (signal) => {
    navigate(createPageUrl('SignalDetail') + `?id=${signal.id}`);
  };

  // Request to join mutation
  const joinMutation = useMutation({
    mutationFn: async (signal) => {
      const user = await base44.auth.me();
      return base44.entities.SignalRequest.create({
        signal_id: signal.id,
        user_id: user.id,
        user_name: user.full_name,
        user_reliability: user.reliability_score || 3,
        status: 'pending'
      });
    },
    onSuccess: () => {
      setSelectedSignal(null);
      queryClient.invalidateQueries(['signals-list']);
    }
  });

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col">
      {/* Map styles */}
      <style>{`
        .leaflet-container {
          background: #0A0A0A !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(26, 26, 26, 0.9) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">Signals</h1>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <button
                onClick={() => setViewMode('map')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  viewMode === 'map' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40'
                }`}
              >
                <MapIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('feed')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  viewMode === 'feed' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              
              {/* Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Sliders className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-zinc-900 border-white/10 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-white">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="text-sm text-white/60 uppercase tracking-wider mb-3 block">Signal Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['all', 'syndicate', 'unwind'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setFilters({ ...filters, type })}
                            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                              filters.type === type
                                ? 'nova-gradient text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-white/60 uppercase tracking-wider mb-3 block">Time Range</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'today', label: 'Today' },
                          { key: 'week', label: 'This Week' },
                        ].map((time) => (
                          <button
                            key={time.key}
                            onClick={() => setFilters({ ...filters, timeRange: time.key })}
                            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                              filters.timeRange === time.key
                                ? 'nova-gradient text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {time.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-white/60 uppercase tracking-wider mb-3 block">
                        Max Distance: {filters.maxDistance} km
                      </label>
                      <Slider
                        value={[filters.maxDistance]}
                        onValueChange={([val]) => setFilters({ ...filters, maxDistance: val })}
                        min={1}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {[
              { key: 'all', label: 'All', icon: null },
              { key: 'syndicate', label: 'High Energy', icon: Zap },
              { key: 'unwind', label: 'Recovery', icon: Moon },
            ].map((f) => (
              <motion.button
                key={f.key}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => setFilters({ ...filters, type: f.key })}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  filters.type === f.key
                    ? f.key === 'syndicate' 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : f.key === 'unwind'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}
              >
                {f.icon && <f.icon className="w-4 h-4" />}
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      {viewMode === 'map' ? (
        <div className="fixed top-[100px] left-0 right-0 bottom-[81px] overflow-hidden">
          {userLocation && !isNaN(userLocation[0]) && !isNaN(userLocation[1]) ? (
            <MapContainer
              center={userLocation}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution=""
              />
              <MapController center={userLocation} />

              {filteredSignals
                .filter(signal => {
                  const lat = parseFloat(signal.latitude);
                  const lng = parseFloat(signal.longitude);
                  return !isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
                })
                .map((signal) => (
                  <Marker
                    key={signal.id}
                    position={[parseFloat(signal.latitude), parseFloat(signal.longitude)]}
                    icon={createSignalMarkerIcon(signal, hostUsers[signal.host_id])}
                    eventHandlers={{
                      click: () => setSelectedSignal(signal)
                    }}
                  />
                ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/40">Loading map...</div>
            </div>
          )}

          {/* Floating Navigation Button - My Location */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={recenterToUserLocation}
            className="fixed bottom-48 right-6 z-[1000] w-12 h-12 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg hover:border-cyan-500/50 transition-colors"
          >
            <Navigation className="w-5 h-5 text-cyan-400" />
          </motion.button>

          {/* Floating Action Button - Drop Signal */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('DropSignal'))}
            className="fixed bottom-32 right-6 z-[1000] w-14 h-14 rounded-full nova-gradient nova-glow-violet flex items-center justify-center shadow-lg"
          >
            <Plus className="w-7 h-7 text-white" />
          </motion.button>

          {/* Selected Signal Card */}
          <AnimatePresence>
            {selectedSignal && (
              <SignalCard
                signal={selectedSignal}
                onClose={() => setSelectedSignal(null)}
                onRequestJoin={(signal) => joinMutation.mutate(signal)}
                isRequesting={joinMutation.isPending}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-24 mt-[100px]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-zinc-900/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-20">
              <Radio className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No signals detected</p>
              <p className="text-white/20 text-sm mt-1">Adjust your filters or drop a new signal</p>
            </div>
          ) : (
            filteredSignals.map((signal, index) => (
              <SignalListCard
                key={signal.id}
                signal={signal}
                index={index}
                onClick={() => handleSignalClick(signal)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}