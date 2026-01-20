import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userIds } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return Response.json({ error: 'Missing or invalid userIds array' }, { status: 400 });
        }

        // Use service role to fetch users by IDs
        const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
        const filteredUsers = users.filter(u => userIds.includes(u.id));

        // Return only public profile data
        const publicUsers = filteredUsers.map(u => ({
            id: u.id,
            full_name: u.full_name,
            username: u.username,
            email: u.email,
            profile_picture: u.profile_picture,
            bio: u.bio,
            trust_stars: u.trust_stars,
            caution_count: u.caution_count,
            safe_count: u.safe_count,
        }));

        return Response.json({ users: publicUsers });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});