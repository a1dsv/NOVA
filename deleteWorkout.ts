import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workoutId } = await req.json();

        if (!workoutId) {
            return Response.json({ error: 'Missing workoutId' }, { status: 400 });
        }

        // Get the workout to check ownership
        const workouts = await base44.entities.Workout.list('-created_date', 1000);
        const workout = workouts.find(w => w.id === workoutId);

        if (!workout) {
            return Response.json({ error: 'Workout not found' }, { status: 404 });
        }

        // Check if user owns the workout or is admin
        if (workout.user_id !== user.id && user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: You can only delete your own workouts' }, { status: 403 });
        }

        // Delete the workout
        await base44.entities.Workout.delete(workoutId);

        return Response.json({ success: true, message: 'Workout deleted successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});