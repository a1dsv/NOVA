import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { friendId } = await req.json();

        if (!friendId) {
            return Response.json({ error: 'Missing friendId' }, { status: 400 });
        }

        // Find friendship record in either direction
        const sentFriendships = await base44.entities.Friend.filter({
            user_id: user.id,
            friend_id: friendId,
        });

        const receivedFriendships = await base44.entities.Friend.filter({
            user_id: friendId,
            friend_id: user.id,
        });

        const friendship = sentFriendships[0] || receivedFriendships[0];

        if (!friendship) {
            return Response.json({ error: 'Friendship not found' }, { status: 404 });
        }

        // Delete the friendship
        await base44.entities.Friend.delete(friendship.id);

        return Response.json({ success: true, message: 'Friend removed successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});