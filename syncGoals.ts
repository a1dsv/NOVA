import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active goals for the user
    const allGoals = await base44.entities.Goal.list('-created_date', 500);
    const userGoals = allGoals.filter(g => g.user_id === user.id && g.status === 'active');

    // Fetch all workouts for the user
    const workouts = await base44.entities.Workout.filter({ user_id: user.id }, '-created_date', 500);
    
    // Fetch all meals for nutrition goals
    const meals = await base44.entities.Meal.filter({ user_id: user.id }, '-created_date', 500);

    const updates = [];

    for (const goal of userGoals) {
      let newValue = goal.current_value || 0;
      let shouldUpdate = false;

      // STRENGTH DISCIPLINE
      if (goal.discipline === 'strength') {
        // Find max weight for specific exercise in goal title
        const exerciseName = goal.title.toLowerCase();
        const relevantWorkouts = workouts.filter(w => w.exercises?.some(ex => 
          ex.name.toLowerCase().includes(exerciseName) || 
          exerciseName.includes(ex.name.toLowerCase())
        ));

        if (relevantWorkouts.length > 0) {
          const maxWeight = Math.max(
            ...relevantWorkouts.flatMap(w => 
              w.exercises
                ?.filter(ex => ex.name.toLowerCase().includes(exerciseName) || exerciseName.includes(ex.name.toLowerCase()))
                ?.flatMap(ex => ex.set_records?.map(s => s.weight || 0) || [])
            ),
            0
          );
          if (maxWeight > newValue) {
            newValue = maxWeight;
            shouldUpdate = true;
          }
        }
      }

      // COMBAT DISCIPLINE
      if (goal.discipline === 'combat') {
        const title = goal.title.toLowerCase();
        
        // Monthly sparring rounds
        if (title.includes('sparring') && title.includes('round')) {
          const now = new Date();
          const thisMonth = workouts.filter(w => {
            const wDate = new Date(w.created_date);
            return w.workout_type === 'martial_arts' && 
                   wDate.getMonth() === now.getMonth() && 
                   wDate.getFullYear() === now.getFullYear();
          });
          
          const totalRounds = thisMonth.reduce((sum, w) => {
            return sum + (w.exercises?.length || 0);
          }, 0);
          
          if (totalRounds !== newValue) {
            newValue = totalRounds;
            shouldUpdate = true;
          }
        }
        
        // Total rounds (all time)
        if (title.includes('total') && title.includes('round')) {
          const martialArtsWorkouts = workouts.filter(w => w.workout_type === 'martial_arts');
          const totalRounds = martialArtsWorkouts.reduce((sum, w) => {
            return sum + (w.exercises?.length || 0);
          }, 0);
          
          if (totalRounds !== newValue) {
            newValue = totalRounds;
            shouldUpdate = true;
          }
        }
      }

      // ENDURANCE DISCIPLINE
      if (goal.discipline === 'endurance') {
        const title = goal.title.toLowerCase();
        const runWorkouts = workouts.filter(w => w.workout_type === 'run');
        
        // Best time for specific distance
        if (title.includes('5k') || title.includes('10k') || title.includes('marathon')) {
          // Find best time in minutes for that distance
          const relevantRuns = runWorkouts.filter(w => {
            const distance = w.exercises?.[0]?.set_records?.[0]?.distance_km || 0;
            if (title.includes('5k')) return distance >= 4.8 && distance <= 5.2;
            if (title.includes('10k')) return distance >= 9.8 && distance <= 10.2;
            if (title.includes('half marathon')) return distance >= 20 && distance <= 22;
            if (title.includes('marathon')) return distance >= 41 && distance <= 43;
            return false;
          });
          
          if (relevantRuns.length > 0) {
            const bestTime = Math.min(
              ...relevantRuns.map(w => w.duration_minutes || Infinity)
            );
            if (bestTime !== Infinity && bestTime !== newValue) {
              newValue = bestTime;
              shouldUpdate = true;
            }
          }
        }
        
        // Total miles
        if (title.includes('total') && title.includes('mile')) {
          const totalKm = runWorkouts.reduce((sum, w) => {
            return sum + (w.exercises?.[0]?.set_records?.[0]?.distance_km || 0);
          }, 0);
          const totalMiles = totalKm * 0.621371;
          
          if (Math.abs(totalMiles - newValue) > 0.1) {
            newValue = Math.round(totalMiles * 10) / 10;
            shouldUpdate = true;
          }
        }
      }

      // NUTRITION DISCIPLINE
      if (goal.discipline === 'nutrition') {
        const title = goal.title.toLowerCase();
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentMeals = meals.filter(m => new Date(m.created_date) > oneWeekAgo);
        
        // Weekly plant diversity
        if (title.includes('plant') && title.includes('diversity')) {
          const plantItems = new Set();
          recentMeals.forEach(meal => {
            const description = (meal.meal_description || '').toLowerCase();
            const items = description.split(/[,;]/);
            items.forEach(item => {
              const trimmed = item.trim();
              // Simple heuristic for plant-based foods
              const plantKeywords = ['vegetable', 'fruit', 'bean', 'lentil', 'grain', 'rice', 'quinoa', 'spinach', 'kale', 'broccoli', 'carrot', 'apple', 'banana', 'berry', 'nut', 'seed'];
              if (plantKeywords.some(kw => trimmed.includes(kw))) {
                plantItems.add(trimmed);
              }
            });
          });
          
          if (plantItems.size !== newValue) {
            newValue = plantItems.size;
            shouldUpdate = true;
          }
        }
        
        // Keto consistency (days under carb limit)
        if (title.includes('keto') || title.includes('carb')) {
          const thisMonth = meals.filter(m => {
            const mDate = new Date(m.created_date);
            return mDate.getMonth() === now.getMonth() && 
                   mDate.getFullYear() === now.getFullYear();
          });
          
          // Group by day
          const dayMap = {};
          thisMonth.forEach(meal => {
            const day = new Date(meal.created_date).toDateString();
            if (!dayMap[day]) dayMap[day] = 0;
            dayMap[day] += meal.carbs || 0;
          });
          
          // Count days under 50g carbs (keto threshold)
          const ketoDays = Object.values(dayMap).filter(carbs => carbs < 50).length;
          
          if (ketoDays !== newValue) {
            newValue = ketoDays;
            shouldUpdate = true;
          }
        }
        
        // Protein target days
        if (title.includes('protein') && title.includes('target')) {
          const targetProtein = user.protein_target || 150;
          const thisMonth = meals.filter(m => {
            const mDate = new Date(m.created_date);
            return mDate.getMonth() === now.getMonth() && 
                   mDate.getFullYear() === now.getFullYear();
          });
          
          // Group by day
          const dayMap = {};
          thisMonth.forEach(meal => {
            const day = new Date(meal.created_date).toDateString();
            if (!dayMap[day]) dayMap[day] = 0;
            dayMap[day] += meal.protein || 0;
          });
          
          const targetDays = Object.values(dayMap).filter(protein => protein >= targetProtein).length;
          
          if (targetDays !== newValue) {
            newValue = targetDays;
            shouldUpdate = true;
          }
        }
      }

      // Update goal if value changed
      if (shouldUpdate) {
        const isCompleted = newValue >= (goal.target_value || 0);
        await base44.entities.Goal.update(goal.id, {
          current_value: newValue,
          status: isCompleted ? 'completed' : 'active'
        });
        updates.push({ goal: goal.title, old: goal.current_value, new: newValue });
      }
    }

    return Response.json({ 
      success: true, 
      updated: updates.length,
      updates 
    });

  } catch (error) {
    console.error('Error syncing goals:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});