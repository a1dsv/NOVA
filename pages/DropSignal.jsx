import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Zap, Moon, MapPin, Clock, 
  Music, Users, X, Check, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const predefinedActivities = [
  { key: 'running', label: 'Running', icon: '🏃' },
  { key: 'calisthenics', label: 'Calisthenics', icon: '💪' },
  { key: 'hiit', label: 'HIIT', icon: '🔥' },
  { key: 'cycling', label: 'Cycling', icon: '🚴' },
  { key: 'yoga', label: 'Yoga', icon: '🧘' },
  { key: 'meditation', label: 'Meditation', icon: '🧠' },
  { key: 'sauna', label: 'Sauna', icon: '🧖' },
  { key: 'stretching', label: 'Stretching', icon: '🤸' },
  { key: 'swimming', label: 'Swimming', icon: '🏊' },
  { key: 'boxing', label: 'Boxing', icon: '🥊' },
  { key: 'climbing', label: 'Climbing', icon: '🧗' },
  { key: 'outdoors', label: 'Outdoors', icon: '🌲' },
];

const energyTypes = [
  { key: 'syndicate', label: 'Syndicate', icon: Zap, color: 'bg-cyan-500' },
  { key: 'unwind', label: 'Unwind', icon: Moon, color: 'bg-amber-500' },
];

const intensities = [
  { key: 'low', label: 'Low', color: 'bg-blue-500' },
  { key: 'moderate', label: 'Moderate', color: 'bg-violet-500' },
  { key: 'high', label: 'High', color: 'bg-orange-500' },
  { key: 'extreme', label: 'Extreme', color: 'bg-red-500' },
];

const images = {
  running: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
  calisthenics: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=800',
  hiit: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800',
  cycling: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  meditation: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
  sauna: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
  stretching: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
};

export default function DropSignal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  
  const [signal, setSignal] = useState({
    types: [],
    activities: [],
    title: '',
    description: '',
    intensity: 'moderate',
    location_name: '',
    business_name: '',
    place_id: '',
    latitude: 40.7128,
    longitude: -74.0060,
    event_time: '',
    duration_minutes: 60,
    max_participants: 10,
    unlimited_participants: false,
    music_link: '',
  });
  
  const [customActivity, setCustomActivity] = useState({ label: '', icon: '' });
  const [showCustomActivity, setShowCustomActivity] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCache, setSearchCache] = useState({});
  const searchTimeoutRef = React.useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setSignal(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      });
    }
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      const primaryActivity = signal.activities[0]?.key || 'running';
      return base44.entities.Signal.create({
        title: signal.title,
        type: signal.types[0] || 'syndicate',
        activity: primaryActivity,
        description: signal.description,
        host_id: user?.id,
        host_name: user?.full_name,
        host_reliability: user?.reliability_score || 3,
        latitude: signal.latitude,
        longitude: signal.longitude,
        location_name: signal.location_name,
        business_name: signal.business_name || '',
        place_id: signal.place_id || '',
        event_time: signal.event_time,
        duration_minutes: signal.duration_minutes,
        max_participants: signal.unlimited_participants ? null : signal.max_participants,
        music_link: signal.music_link,
        vibe: signal.intensity,
        image_url: images[primaryActivity],
        status: 'active',
        current_participants: 0,
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('Transmission'));
    }
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleActivity = (activityKey, activityLabel, activityIcon) => {
    const exists = signal.activities.find(a => a.key === activityKey);
    if (exists) {
      setSignal({ ...signal, activities: signal.activities.filter(a => a.key !== activityKey) });
    } else {
      setSignal({ ...signal, activities: [...signal.activities, { key: activityKey, label: activityLabel, icon: activityIcon }] });
    }
  };
  
  const addCustomActivity = () => {
    if (customActivity.label && customActivity.icon) {
      const key = customActivity.label.toLowerCase().replace(/\s+/g, '_');
      setSignal({ ...signal, activities: [...signal.activities, { key, label: customActivity.label, icon: customActivity.icon }] });
      setCustomActivity({ label: '', icon: '' });
      setShowCustomActivity(false);
    }
  };
  
  const toggleEnergyType = (typeKey) => {
    if (signal.types.includes(typeKey)) {
      setSignal({ ...signal, types: signal.types.filter(t => t !== typeKey) });
    } else {
      setSignal({ ...signal, types: [...signal.types, typeKey] });
    }
  };
  
  const searchAddress = async (query) => {
    const searchQuery = query || addressSearch;
    if (!searchQuery || searchQuery.length < 3) {
      setLocationSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Check cache first
    const cacheKey = searchQuery.toLowerCase();
    if (searchCache[cacheKey]) {
      setLocationSuggestions(searchCache[cacheKey]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // Detect UK postcode pattern
      const isPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(searchQuery);
      
      // Use Nominatim with POI/amenity support, biased to user location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `limit=8&` +
        `addressdetails=1&` +
        `extratags=1&` +
        `namedetails=1&` +
        `viewbox=${signal.longitude - 0.2},${signal.latitude - 0.2},${signal.longitude + 0.2},${signal.latitude + 0.2}&` +
        `bounded=${isPostcode ? 0 : 0}`
      );
      const data = await response.json();
      
      // Sort by distance from user
      const sortedData = data.sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(parseFloat(a.lat) - signal.latitude, 2) +
          Math.pow(parseFloat(a.lon) - signal.longitude, 2)
        );
        const distB = Math.sqrt(
          Math.pow(parseFloat(b.lat) - signal.latitude, 2) +
          Math.pow(parseFloat(b.lon) - signal.longitude, 2)
        );
        return distA - distB;
      });
      
      // Enhance results with business/POI detection
      const enhancedData = sortedData.map(item => ({
        ...item,
        is_business: item.type === 'amenity' || item.type === 'leisure' || 
                     item.type === 'shop' || item.type === 'tourism' ||
                     item.class === 'amenity' || item.class === 'leisure',
        business_name: item.namedetails?.name || item.name || null,
        subtitle: item.display_name.split(',').slice(1, 3).join(',').trim(),
        is_postcode: isPostcode && item.type === 'postcode'
      }));
      
      // Cache the results
      setSearchCache(prev => ({ ...prev, [cacheKey]: enhancedData }));
      setLocationSuggestions(enhancedData || []);
    } catch (e) {
      console.error('Geocoding error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = (query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(query);
    }, 300);
  };

  const selectLocation = (location) => {
    const businessName = location.business_name || location.display_name.split(',')[0];
    
    // Smooth transition
    setSignal({
      ...signal,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      location_name: location.subtitle || location.display_name.split(',').slice(1, 3).join(',').trim(),
      business_name: location.is_business ? businessName : '',
      place_id: location.place_id || '',
    });
    setAddressSearch('');
    setLocationSuggestions([]);
    setIsSearching(false);
    
    // Auto-show map with smooth transition for businesses/postcodes
    if (location.is_business || location.is_postcode) {
      setTimeout(() => setShowMapPicker(true), 100);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&` +
        `lat=${lat}&` +
        `lon=${lng}&` +
        `addressdetails=1&` +
        `extratags=1&` +
        `namedetails=1&` +
        `zoom=18`
      );
      const data = await response.json();
      if (data && data.display_name) {
        const isBusiness = data.type === 'amenity' || data.type === 'leisure' || 
                          data.type === 'shop' || data.type === 'tourism';
        const businessName = isBusiness ? (data.namedetails?.name || data.name) : '';
        
        setSignal({
          ...signal,
          latitude: lat,
          longitude: lng,
          location_name: data.display_name.split(',').slice(1, 3).join(',').trim(),
          business_name: businessName || '',
          place_id: data.place_id || '',
        });
      }
    } catch (e) {
      console.error('Reverse geocoding error:', e);
    }
  };

  const canProceed = () => {
    if (step === 1) return signal.activities.length > 0 && signal.types.length > 0;
    if (step === 2) return signal.title !== '' && signal.event_time !== '';
    return true;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
        
        <h1 className="text-lg font-bold text-white">Drop a Signal</h1>
        
        <div className="w-10" />
      </div>
      
      {/* Progress */}
      <div className="flex gap-2 px-4 py-3">
        {[1, 2, 3].map((s) => (
          <div 
            key={s}
            className={`flex-1 h-1 rounded-full transition-all ${
              s <= step ? 'nova-gradient' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      
      {/* Step Content */}
      <div className="flex-1 px-4 py-6 pb-40 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Activity Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Energy</h2>
                <p className="text-white/40 text-sm">Select energy types and activities</p>
              </div>
              
              {/* Energy Types - Multi-select */}
              <div>
                <p className="text-white/60 text-sm mb-3">Energy Types (select all that apply)</p>
                <div className="grid grid-cols-2 gap-3">
                  {energyTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = signal.types.includes(type.key);
                    return (
                      <button
                        key={type.key}
                        onClick={() => toggleEnergyType(type.key)}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? `${type.color}/20 border-${type.color.replace('bg-', '')}/50`
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? type.color.replace('bg-', 'text-') : 'text-white/40'}`} />
                        <p className={`font-semibold ${isSelected ? type.color.replace('bg-', 'text-') : 'text-white/60'}`}>{type.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Activities - Multi-select */}
              <div>
                <p className="text-white/60 text-sm mb-3">Activities (select all that apply)</p>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedActivities.map((act) => {
                    const isSelected = signal.activities.find(a => a.key === act.key);
                    return (
                      <button
                        key={act.key}
                        onClick={() => toggleActivity(act.key, act.label, act.icon)}
                        className={`p-4 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'nova-gradient border-transparent'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{act.icon}</span>
                        <p className="text-white font-medium">{act.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Selected Activities Display */}
              {signal.activities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {signal.activities.map((act) => (
                    <Badge key={act.key} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border px-3 py-1">
                      {act.icon} {act.label}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Custom Activity */}
              {!showCustomActivity ? (
                <Button
                  onClick={() => setShowCustomActivity(true)}
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  + Add Custom Activity
                </Button>
              ) : (
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-3">
                  <Input
                    value={customActivity.label}
                    onChange={(e) => setCustomActivity({ ...customActivity, label: e.target.value })}
                    placeholder="Activity name"
                    className="bg-black/30 border-white/10 text-white"
                  />
                  <Input
                    value={customActivity.icon}
                    onChange={(e) => setCustomActivity({ ...customActivity, icon: e.target.value })}
                    placeholder="Emoji (e.g., 🏋️)"
                    className="bg-black/30 border-white/10 text-white"
                    maxLength={2}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addCustomActivity} className="flex-1 nova-gradient">Add</Button>
                    <Button onClick={() => setShowCustomActivity(false)} variant="outline" className="flex-1 bg-white/5 border-white/10 text-white">Cancel</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Signal Details</h2>
                <p className="text-white/40 text-sm">Set the time, place, and vibe</p>
              </div>
              
              {/* Title */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Signal Title</label>
                <Input
                  value={signal.title}
                  onChange={(e) => setSignal({ ...signal, title: e.target.value })}
                  placeholder="e.g., Morning Burn Session"
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30 h-12"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Description (optional)</label>
                <Textarea
                  value={signal.description}
                  onChange={(e) => setSignal({ ...signal, description: e.target.value })}
                  placeholder="Brief description of the session..."
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                />
              </div>
              
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={signal.event_time}
                    onChange={(e) => setSignal({ ...signal, event_time: e.target.value })}
                    className="bg-zinc-900/50 border-white/10 text-white h-12"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Duration</label>
                  <Input
                    type="number"
                    value={signal.duration_minutes}
                    onChange={(e) => setSignal({ ...signal, duration_minutes: parseInt(e.target.value) })}
                    className="bg-zinc-900/50 border-white/10 text-white h-12"
                    suffix="min"
                  />
                </div>
              </div>
              
              {/* Location with Smart Search & Map */}
              <div>
                <label className="text-white/60 text-sm mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      value={addressSearch}
                      onChange={(e) => {
                        setAddressSearch(e.target.value);
                        debouncedSearch(e.target.value);
                      }}
                      placeholder="Search gym, park, postcode..."
                      className="bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30 h-12"
                    />
                    
                    {/* Location Suggestions Dropdown - Enhanced with Loading State */}
                    {(isSearching || locationSuggestions.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-2 bg-zinc-900 border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl max-h-80 overflow-y-auto"
                      >
                        {isSearching ? (
                          // Skeleton Loader
                          <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-start gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-lg bg-white/10" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-white/10 rounded w-3/4" />
                                  <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Results
                          locationSuggestions.map((location, idx) => (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => selectLocation(location)}
                              className="w-full text-left px-4 py-3 hover:bg-cyan-500/10 active:bg-cyan-500/20 transition-colors border-b border-white/5 last:border-b-0"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                  location.is_business ? 'bg-green-500/20' : location.is_postcode ? 'bg-amber-500/20' : 'bg-cyan-500/20'
                                }`}>
                                  <MapPin className={`w-4 h-4 ${
                                    location.is_business ? 'text-green-400' : location.is_postcode ? 'text-amber-400' : 'text-cyan-400'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-semibold">
                                    {location.business_name || location.display_name.split(',')[0]}
                                  </p>
                                  <p className="text-white/40 text-xs truncate">
                                    {location.subtitle || location.display_name.split(',').slice(1, 3).join(',')}
                                  </p>
                                  {location.is_business && (
                                    <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                                      Business
                                    </Badge>
                                  )}
                                  {location.is_postcode && (
                                    <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                      Postcode
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Current Location Display - Enhanced */}
                  {signal.location_name && (
                    <div className={`border rounded-xl p-3 ${
                      signal.business_name 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-cyan-500/10 border-cyan-500/30'
                    }`}>
                      <div className="flex items-start gap-2">
                        <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          signal.business_name ? 'text-green-400' : 'text-cyan-400'
                        }`} />
                        <div className="flex-1">
                          {signal.business_name && (
                            <p className="text-green-400 text-sm font-bold mb-0.5">
                              {signal.business_name}
                            </p>
                          )}
                          <p className={`text-sm ${
                            signal.business_name ? 'text-white/60' : 'text-cyan-400 font-medium'
                          }`}>
                            {signal.location_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    variant="outline"
                    className="w-full bg-white/5 border-white/10 text-white h-12 hover:border-cyan-500/30"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {showMapPicker ? 'Hide Map' : 'Fine-tune on Map'}
                  </Button>
                  
                  {/* Interactive Map */}
                  {showMapPicker && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     transition={{ duration: 0.3, ease: "easeInOut" }}
                     className="overflow-hidden"
                   >
                      <div className="h-64 rounded-xl overflow-hidden border border-cyan-500/30 shadow-lg">
                        <MapContainer
                          center={[signal.latitude, signal.longitude]}
                          zoom={signal.business_name || signal.place_id ? 17 : 14}
                          style={{ height: '100%', width: '100%' }}
                          onClick={(e) => {
                            reverseGeocode(e.latlng.lat, e.latlng.lng);
                          }}
                        >
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                          <Marker position={[signal.latitude, signal.longitude]} />
                        </MapContainer>
                      </div>
                      <p className="text-white/40 text-xs mt-2 text-center">
                        Tap on the map to set exact location
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Intensity */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Intensity</label>
                <div className="grid grid-cols-4 gap-2">
                  {intensities.map((int) => (
                    <button
                      key={int.key}
                      onClick={() => setSignal({ ...signal, intensity: int.key })}
                      className={`py-3 rounded-xl border transition-all ${
                        signal.intensity === int.key
                          ? `${int.color} border-transparent text-black font-semibold`
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      {int.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Max Participants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white/60 text-sm">
                    Max Participants: {signal.unlimited_participants ? '∞' : signal.max_participants}
                  </label>
                  <button
                    onClick={() => setSignal({ ...signal, unlimited_participants: !signal.unlimited_participants })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      signal.unlimited_participants
                        ? 'nova-gradient text-white'
                        : 'bg-white/5 text-white/60'
                    }`}
                  >
                    Unlimited
                  </button>
                </div>
                {!signal.unlimited_participants && (
                  <Slider
                    value={[signal.max_participants]}
                    onValueChange={([val]) => setSignal({ ...signal, max_participants: val })}
                    min={2}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                )}
              </div>
            </motion.div>
          )}
          
          {/* Step 3: Music */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">The Music Link</h2>
                <p className="text-white/40 text-sm">Share a playlist for your session</p>
              </div>
              
              {/* Preview Card */}
              <div className="relative h-48 rounded-2xl overflow-hidden">
                <img 
                  src={signal.activities.length > 0 ? images[signal.activities[0].key] || images.running : images.running}
                  alt={signal.activities.length > 0 ? signal.activities[0].label : 'activity'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-lg">{signal.title || 'Your Signal'}</p>
                  {signal.business_name ? (
                    <>
                      <p className="text-green-400 text-sm font-semibold">{signal.business_name}</p>
                      <p className="text-white/40 text-xs">{signal.location_name}</p>
                    </>
                  ) : (
                    <p className="text-white/60 text-sm">{signal.location_name || 'Location TBD'}</p>
                  )}
                  <div className="flex gap-1 mt-2">
                    {signal.activities.slice(0, 3).map(act => (
                      <span key={act.key} className="text-lg">{act.icon}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Music Link Input */}
              <div>
                <label className="text-white/60 text-sm mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Spotify or Apple Music Playlist URL
                </label>
                <Input
                  value={signal.music_link}
                  onChange={(e) => setSignal({ ...signal, music_link: e.target.value })}
                  placeholder="https://open.spotify.com/playlist/..."
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30 h-12"
                />
                <p className="text-white/30 text-xs mt-2">
                  Members will be able to join your shared session
                </p>
              </div>
              
              {/* Summary */}
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-white font-semibold">Signal Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Types</span>
                    <span className="text-white">{signal.types.map(t => t === 'syndicate' ? 'Syndicate' : 'Unwind').join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Activities</span>
                    <span className="text-white">{signal.activities.map(a => a.label).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Intensity</span>
                    <span className="text-white capitalize">{signal.intensity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Max Size</span>
                    <span className="text-white">{signal.unlimited_participants ? 'Unlimited' : `${signal.max_participants} people`}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-white/5 flex gap-3" style={{ marginBottom: '72px' }}>
        {step > 1 && (
          <Button
            onClick={handlePrev}
            variant="outline"
            className="flex-1 h-14 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        )}
        
        {step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`${step === 1 ? 'w-full' : 'flex-1'} h-14 ${canProceed() ? 'nova-gradient' : 'bg-white/10'} text-white font-semibold`}
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex-1 h-14 nova-gradient nova-glow-violet text-white font-semibold"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Drop Signal
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}