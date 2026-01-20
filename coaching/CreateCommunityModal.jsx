import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

const FOCUS_AREAS = [
  'Powerlifting', 'Bodybuilding', 'Calisthenics', 'CrossFit',
  'Running', 'Cycling', 'Swimming', 'Triathlon',
  'Boxing', 'MMA', 'Kickboxing', 'BJJ',
  'Yoga', 'Pilates', 'Mobility', 'Recovery',
  'Weight Loss', 'Muscle Gain', 'Endurance', 'Strength'
];

export default function CreateCommunityModal({ isOpen, onClose, onCreate, userId, userName }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const toggleArea = (area) => {
    setSelectedAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleCreate = () => {
    onCreate({
      name,
      description,
      coach_id: userId,
      coach_name: userName,
      focus_areas: selectedAreas,
      image_url: imageUrl,
      members: [userId],
      is_public: true,
    });
    setName('');
    setDescription('');
    setSelectedAreas([]);
    setImageUrl('');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">Create Coaching Community</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">Community Image</label>
            <label className="block">
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors">
                {imageUrl ? (
                  <img src={imageUrl} alt="Community" className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">Click to upload banner image</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Community Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Elite Powerlifting Academy"
              className="bg-black/30 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your community offer?"
              className="bg-black/30 border-white/10 text-white min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-3 block">Focus Areas (select all that apply)</label>
            <div className="grid grid-cols-3 gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedAreas.includes(area)
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name || !description || selectedAreas.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black h-12 font-semibold"
          >
            <Users className="w-4 h-4 mr-2" />
            Create Community
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}