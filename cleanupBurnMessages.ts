import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Fetch all burn messages
    const allMessages = await base44.asServiceRole.entities.CircleMessage.list('-created_date', 1000);
    
    // Filter burn messages older than 24 hours (but not saved or pinned ones)
    const oldBurnMessages = allMessages.filter(msg => 
      msg.type === 'burn' && 
      new Date(msg.created_date) < twentyFourHoursAgo &&
      !msg.saved &&
      !msg.pinned
    );

    // Delete old burn messages
    const deletePromises = oldBurnMessages.map(msg => 
      base44.asServiceRole.entities.CircleMessage.delete(msg.id)
    );

    await Promise.all(deletePromises);

    return Response.json({ 
      success: true, 
      deleted: oldBurnMessages.length,
      message: `Deleted ${oldBurnMessages.length} burn messages older than 24 hours`
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});