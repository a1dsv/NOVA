import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { circleId, messageId, mentions } = await req.json();

    // Fetch the message and circle
    const messages = await base44.asServiceRole.entities.CircleMessage.filter({ id: messageId }, '-created_date', 1);
    const message = messages[0];
    
    if (!message) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    const circles = await base44.asServiceRole.entities.Circle.filter({ id: circleId }, '-created_date', 1);
    const circle = circles[0];

    if (!circle) {
      return Response.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Get all circle members except the sender
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    const circleMembers = allUsers.filter(u => 
      circle.members?.includes(u.id) && u.id !== user.id
    );

    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      const mentionedUsers = circleMembers.filter(u => mentions.includes(u.id));
      
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: mentionedUser.email,
              subject: `${user.full_name} mentioned you in ${circle.name}`,
              body: `
                <h2>You were mentioned!</h2>
                <p><strong>${user.full_name}</strong> mentioned you in <strong>${circle.name}</strong>:</p>
                <blockquote style="border-left: 3px solid #8F00FF; padding-left: 15px; margin: 20px 0;">
                  ${message.content}
                </blockquote>
                <p>Open the NOVA app to reply!</p>
              `
            });
          } catch (error) {
            console.error(`Failed to send email to ${mentionedUser.email}:`, error);
          }
        }
      }
    } else {
      // Send notification to all circle members (general message)
      for (const member of circleMembers) {
        if (member.email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: member.email,
              subject: `New message in ${circle.name}`,
              body: `
                <h2>New message from ${user.full_name}</h2>
                <p>In <strong>${circle.name}</strong>:</p>
                <blockquote style="border-left: 3px solid #00F2FF; padding-left: 15px; margin: 20px 0;">
                  ${message.type === 'image' ? '📷 Sent an image' : message.content}
                </blockquote>
                <p>Open the NOVA app to reply!</p>
              `
            });
          } catch (error) {
            console.error(`Failed to send email to ${member.email}:`, error);
          }
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});