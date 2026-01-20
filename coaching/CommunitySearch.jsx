import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Star, TrendingUp, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const FOCUS_AREAS = [
  'Powerlifting', 'Bodybuilding', 'Calisthenics', 'CrossFit',
  'Running', 'Cycling', 'Swimming', 'Triathlon',
  'Boxing', 'MMA', 'Kickboxing', 'BJJ',
  'Yoga', 'Pilates', 'Mobility', 'Recovery',
  'Weight Loss', 'Muscle Gain', 'Endurance', 'Strength'
];

export default function CommunitySearch({ communities, onJoin, userId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('visibility');

  const toggleFilter = (filter) => {
    setSelectedFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  // Filter communities
  let filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilters = selectedFilters.length === 0 ||
                          selectedFilters.some(f => c.focus_areas?.includes(f));
    return matchesSearch && matchesFilters;
  });

  // Sort communities
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'visibility') {
      return (b.visibility_score || 0) - (a.visibility_score || 0);
    } else if (sortBy === 'members') {
      return (b.members?.length || 0) - (a.members?.length || 0);
    } else if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    return 0;
  });

  const isMember = (community) => community.members?.includes(userId);

  return (
    <div className="space-y-4">
      {/* Search & Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities..."
            className="bg-zinc-900/50 border-white/10 text-white pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-zinc-900/50 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value="visibility">Ranking</option>
          <option value="members">Most Members</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Filters */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-white/40" />
          <span className="text-white/60 text-sm">Focus Areas</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {FOCUS_AREAS.slice(0, 10).map((area) => (
            <button
              key={area}
              onClick={() => toggleFilter(area)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedFilters.includes(area)
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Users className="w-8 h-8 mx-auto mb-2 text-white/20" />
            <p>No communities found</p>
          </div>
        ) : (
          filtered.map((community, index) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:border-amber-500/30 transition-all"
            >
              <div className="flex gap-4">
                {community.image_url && (
                  <img
                    src={community.image_url}
                    alt={community.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold mb-1">{community.name}</h3>
                      <p className="text-white/60 text-sm mb-2 line-clamp-2">{community.description}</p>
                    </div>
                    {sortBy === 'visibility' && (
                      <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 ml-2">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        #{index + 1}
                      </Badge>
                    )}
                  </div>

                  {/* Focus Areas */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {community.focus_areas?.slice(0, 3).map((area) => (
                      <Badge
                        key={area}
                        className="bg-amber-500/10 text-amber-400 text-xs border-0"
                      >
                        {area}
                      </Badge>
                    ))}
                    {community.focus_areas?.length > 3 && (
                      <Badge className="bg-white/5 text-white/40 text-xs border-0">
                        +{community.focus_areas.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Stats & Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {community.members?.length || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {community.rating?.toFixed(1) || '0.0'}
                        {community.total_ratings > 0 && (
                          <span>({community.total_ratings})</span>
                        )}
                      </div>
                    </div>

                    {isMember(community) ? (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        Joined
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => onJoin(community)}
                        size="sm"
                        className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 h-7 text-xs"
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}