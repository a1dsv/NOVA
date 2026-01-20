import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_id, new_value } = await req.json();

    if (!goal_id || new_value === undefined) {
      return Response.json({ error: 'Missing goal_id or new_value' }, { status: 400 });
    }

    // Get the goal
    const goals = await base44.entities.Goal.filter({ id: goal_id });
    const goal = goals[0];

    if (!goal) {
      return Response.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.user_id !== user.id) {
      return Response.json({ error: 'Not authorized to update this goal' }, { status: 403 });
    }

    // Update the goal
    const isCompleted = new_value >= goal.target_value;
    const updatedGoal = await base44.entities.Goal.update(goal_id, {
      current_value: new_value,
      status: isCompleted ? 'completed' : 'active'
    });

    // If goal is linked to a circle and just completed, share the achievement
    if (isCompleted && goal.circle_id && goal.is_public && goal.status !== 'completed') {
      try {
        await base44.entities.CircleMessage.create({
          circle_id: goal.circle_id,
          sender_id: user.id,
          sender_name: user.full_name,
          content: `🏆 **Goal Achieved!**\n\n${user.full_name} just completed: **${goal.title}**\n\n🎯 Final: ${new_value} ${goal.metric_unit}\n\nCongratulations! 🎉`,
          type: 'text'
        });
      } catch (e) {
        console.error('Failed to post achievement to circle:', e);
      }
    }

    return Response.json({ 
      success: true, 
      goal: updatedGoal,
      completed: isCompleted
    });

  } catch (error) {
    console.error('Error updating goal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});