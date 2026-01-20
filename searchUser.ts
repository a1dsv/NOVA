import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchBy, query } = await req.json();

        if (!searchBy || !query) {
            return Response.json({ error: 'Missing searchBy or query' }, { status: 400 });
        }

        // Use service role to search users
        const searchFilter = searchBy === 'username' 
            ? { username: query.toLowerCase() } 
            : { email: query.toLowerCase() };
        
        const users = await base44.asServiceRole.entities.User.filter(searchFilter, '-created_date', 1);

        if (users.length === 0) {
            return Response.json({ error: `User not found with ${searchBy}: ${query}` }, { status: 404 });
        }

        // Return only public profile data
        const foundUser = users[0];
        return Response.json({
            id: foundUser.id,
            full_name: foundUser.full_name,
            username: foundUser.username,
            email: foundUser.email,
            profile_picture: foundUser.profile_picture,
            bio: foundUser.bio,
            trust_stars: foundUser.trust_stars,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});