import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Minus, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SmartMealParser from './SmartMealParser';

export default function LogMealModal({ isOpen, onClose, onSuccess, userId }) {
  const [mealType, setMealType] = useState('breakfast');
  const [foods, setFoods] = useState([]);
  const [proofPhoto, setProofPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notes, setNotes] = useState('');
  const [useSmartSearch, setUseSmartSearch] = useState(true);
  const [currentFood, setCurrentFood] = useState({ name: '', quantity: '', weight_grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);

  const adjustMacro = (key, delta) => {
    setCurrentFood({ ...currentFood, [key]: Math.max(0, currentFood[key] + delta) });
  };

  const addFood = () => {
    if (!currentFood.name || currentFood.calories === 0) return;
    if (editingFoodIndex !== null) {
      const updatedFoods = [...foods];
      updatedFoods[editingFoodIndex] = currentFood;
      setFoods(updatedFoods);
      setEditingFoodIndex(null);
    } else {
      setFoods([...foods, currentFood]);
    }
    setCurrentFood({ name: '', quantity: '', weight_grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const editFood = (index) => {
    const food = foods[index];
    setCurrentFood({ ...food, originalWeight: food.weight_grams });
    setEditingFoodIndex(index);
  };

  const updateMacrosFromWeight = (newWeight) => {
    if (!currentFood.originalWeight || currentFood.originalWeight === 0) {
      setCurrentFood({ ...currentFood, weight_grams: newWeight });
      return;
    }
    
    const ratio = newWeight / currentFood.originalWeight;
    setCurrentFood({
      ...currentFood,
      weight_grams: newWeight,
      calories: Math.round((currentFood.calories / (currentFood.weight_grams / currentFood.originalWeight || 1)) * ratio),
      protein: Math.round((currentFood.protein / (currentFood.weight_grams / currentFood.originalWeight || 1)) * ratio),
      carbs: Math.round((currentFood.carbs / (currentFood.weight_grams / currentFood.originalWeight || 1)) * ratio),
      fat: Math.round((currentFood.fat / (currentFood.weight_grams / currentFood.originalWeight || 1)) * ratio)
    });
  };

  const removeFood = (index) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const getTotals = () => {
    return foods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      fiber: acc.fiber + food.fiber
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProofPhoto(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleParsed = (data) => {
    if (data.items && data.items.length > 0) {
      const parsedFoods = data.items.map(item => ({
        name: item.name,
        quantity: item.quantity || '',
        weight_grams: item.weight_grams || 0,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        fiber: item.fiber || 0
      }));
      setFoods([...foods, ...parsedFoods]);
    }
  };

  const handleSave = async () => {
    const totals = getTotals();
    await base44.entities.Meal.create({
      user_id: userId,
      meal_type: mealType,
      meal_date: new Date().toISOString().split('T')[0],
      foods: [],
      items: foods,
      total_calories: totals.calories,
      total_protein: totals.protein,
      total_carbs: totals.carbs,
      total_fat: totals.fat,
      total_fiber: totals.fiber,
      water_ml: 0,
      proof_photo_url: proofPhoto,
      notes
    });

    onSuccess();
    onClose();
    setFoods([]);
    setCurrentFood({ name: '', quantity: '', weight_grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    setProofPhoto(null);
    setNotes('');
    setEditingFoodIndex(null);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[10001] flex flex-col overflow-hidden"
    >
      <div className="relative flex-1 flex flex-col max-w-2xl w-full mx-auto overflow-y-auto scrollbar-hide pb-32"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="p-6 flex-1 flex flex-col">
        {/* Slim Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-black/60 backdrop-blur-xl z-10 py-4 -mt-6 -mx-6 px-6">
          <h2 className="text-white font-mono font-bold text-xl tracking-wider uppercase">Nova Nutrition Log</h2>
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10"
          >
            <X className="w-5 h-5 text-white/60" />
          </motion.button>
        </div>

        <div className="space-y-6">
          {/* Meal Type Selector */}
          <div>
            <label className="text-white/40 text-xs mb-3 block uppercase tracking-wider font-semibold">Meal Window</label>
            <div className="grid grid-cols-4 gap-2">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <motion.button
                  key={type}
                  onClick={() => setMealType(type)}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={`h-12 rounded-xl backdrop-blur-xl border font-semibold text-xs uppercase tracking-wider ${
                    mealType === type
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Smart Search or Manual Entry Toggle */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Meal Input</h3>
              <button
                onClick={() => setUseSmartSearch(!useSmartSearch)}
                className="text-cyan-400 text-xs hover:text-cyan-300 uppercase tracking-wider font-semibold"
              >
                {useSmartSearch ? 'Manual Entry →' : '← Smart Search'}
              </button>
            </div>

            {useSmartSearch ? (
              <SmartMealParser onParsed={handleParsed} />
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={currentFood.name}
                  onChange={(e) => setCurrentFood({ ...currentFood, name: e.target.value })}
                  placeholder="Food name (e.g., chicken breast)"
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/30"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={currentFood.quantity}
                    onChange={(e) => setCurrentFood({ ...currentFood, quantity: e.target.value })}
                    placeholder="Quantity (e.g., 2 pieces)"
                    className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/30"
                  />
                  <input
                    type="number"
                    value={currentFood.weight_grams || ''}
                    onChange={(e) => {
                      const newWeight = parseInt(e.target.value) || 0;
                      if (editingFoodIndex !== null && currentFood.originalWeight) {
                        updateMacrosFromWeight(newWeight);
                      } else {
                        setCurrentFood({ ...currentFood, weight_grams: newWeight });
                      }
                    }}
                    placeholder="Weight (g)"
                    className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/30 font-mono"
                  />
                </div>
              </div>
            )}
            
            {/* Quick Log Meal Button */}
            <motion.button
              onClick={handleSave}
              disabled={foods.length === 0}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.4)] uppercase text-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
            >
              Log Meal
            </motion.button>
          </div>

          {/* Individual Food Items */}
          {foods.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-white/40 font-bold mb-3 uppercase tracking-wider text-xs">Foods in Meal</h4>
              <div className="space-y-2">
                {foods.map((food, idx) => (
                  <div key={idx} className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{food.name}</p>
                        {(food.quantity || food.weight_grams > 0) && (
                          <p className="text-white/60 text-xs mt-0.5">
                            {food.quantity && `${food.quantity}`}
                            {food.weight_grams > 0 && ` (${food.weight_grams}g)`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => editFood(idx)}
                          className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"
                        >
                          <span className="text-cyan-400 text-xs">✎</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => removeFood(idx)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                        <p className="text-emerald-400 font-bold font-mono text-sm">{food.calories}</p>
                        <p className="text-emerald-400/60 text-[10px] uppercase">Cal</p>
                      </div>
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-center">
                        <p className="text-cyan-400 font-bold font-mono text-sm">{food.protein}g</p>
                        <p className="text-cyan-400/60 text-[10px] uppercase">P</p>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                        <p className="text-orange-400 font-bold font-mono text-sm">{food.carbs}g</p>
                        <p className="text-orange-400/60 text-[10px] uppercase">C</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
                        <p className="text-amber-400 font-bold font-mono text-sm">{food.fat}g</p>
                        <p className="text-amber-400/60 text-[10px] uppercase">F</p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                        <p className="text-green-400 font-bold font-mono text-sm">{food.fiber || 0}g</p>
                        <p className="text-green-400/60 text-[10px] uppercase">Fiber</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Macros */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white font-bold text-xs uppercase tracking-wider mb-3">Total Macros</p>
                <div className="grid grid-cols-5 gap-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                    <p className="text-emerald-400 font-bold font-mono text-lg">{getTotals().calories}</p>
                    <p className="text-emerald-400/60 text-[10px] uppercase mt-1">Cal</p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                    <p className="text-cyan-400 font-bold font-mono text-lg">{getTotals().protein}g</p>
                    <p className="text-cyan-400/60 text-[10px] uppercase mt-1">P</p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                    <p className="text-orange-400 font-bold font-mono text-lg">{getTotals().carbs}g</p>
                    <p className="text-orange-400/60 text-[10px] uppercase mt-1">C</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                    <p className="text-amber-400 font-bold font-mono text-lg">{getTotals().fat}g</p>
                    <p className="text-amber-400/60 text-[10px] uppercase mt-1">F</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                    <p className="text-green-400 font-bold font-mono text-lg">{getTotals().fiber}g</p>
                    <p className="text-green-400/60 text-[10px] uppercase mt-1">Fiber</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Macro Configuration for Current Food */}
          <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-white/40 font-bold mb-4 uppercase tracking-wider text-xs">Macro Configuration</h4>
            <div className="space-y-3">
              {[
                { key: 'calories', label: 'Cal', step: 50, color: 'emerald', rgb: '16, 185, 129' },
                { key: 'protein', label: 'Protein', step: 5, suffix: 'g', color: 'cyan', rgb: '0, 210, 255' },
                { key: 'carbs', label: 'Carbs', step: 10, suffix: 'g', color: 'orange', rgb: '251, 146, 60' },
                { key: 'fat', label: 'Fat', step: 5, suffix: 'g', color: 'amber', rgb: '245, 158, 11' },
                { key: 'fiber', label: 'Fiber', step: 2, suffix: 'g', color: 'green', rgb: '34, 197, 94' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2 bg-black/20 rounded-xl p-3">
                  <span className="text-white/40 text-xs uppercase tracking-wider font-semibold w-16 flex-shrink-0">{item.label}</span>
                  <div className="flex items-center gap-2 flex-1 justify-between">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      onClick={() => adjustMacro(item.key, -item.step)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 flex-shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <div className="text-emerald-400 text-3xl font-bold font-mono text-center flex-1 neon-data">
                      {currentFood[item.key]}
                      {item.suffix && <span className="text-sm text-white/40 ml-1">{item.suffix}</span>}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      onClick={() => adjustMacro(item.key, item.step)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add/Update Food Button */}
            <motion.button
              onClick={addFood}
              disabled={!currentFood.name || currentFood.calories === 0}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full h-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm hover:bg-emerald-500/30"
            >
              {editingFoodIndex !== null ? (
                <>
                  <span className="inline mr-2">✓</span>
                  Update Food
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add to Meal
                </>
              )}
            </motion.button>
          </div>

          {/* Photo Anchor */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
            id="proof-photo"
          />
          <label htmlFor="proof-photo">
            <motion.div
              whileTap={{ scale: 0.96, boxShadow: '0 0 50px rgba(16, 185, 129, 0.8)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:bg-emerald-500/20 backdrop-blur-xl shadow-[0_0_25px_rgba(16,185,129,0.2)]"
            >
              {uploadingPhoto ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full"
                />
              ) : proofPhoto ? (
                <>
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-emerald-500/30">
                    <img src={proofPhoto} alt="Proof" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-sm">Meal Proof Captured</span>
                    <span className="text-white/40 text-xs font-mono">{new Date().toISOString().split('T')[0]}</span>
                  </div>
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 text-emerald-400 glow-recovery" />
                  <div className="flex flex-col">
                    <span className="text-emerald-400 font-bold tracking-wider uppercase text-sm">Capture Meal Proof</span>
                    <span className="text-white/40 text-xs font-mono">{new Date().toISOString().split('T')[0]}</span>
                  </div>
                </>
              )}
            </motion.div>
          </label>

          {/* Notes */}
          <div>
            <label className="text-white/40 text-xs mb-2 block uppercase tracking-wider font-semibold">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pre/post workout? How do you feel?"
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white min-h-[80px] focus:outline-none focus:border-emerald-500/30 font-mono text-sm"
            />
          </div>
        </div>

        {/* Heavy Vibrant Save Button */}
        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-1 h-16 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-semibold rounded-xl uppercase tracking-wider text-sm"
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleSave}
            disabled={foods.length === 0}
            whileTap={{ scale: 0.96, boxShadow: '0 0 80px rgba(16, 185, 129, 1)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-1 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.5)] uppercase"
          >
            Log Meal
          </motion.button>
        </div>
        </div>
      </div>
    </motion.div>
  );
}