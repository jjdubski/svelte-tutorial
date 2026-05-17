import { json } from '@sveltejs/kit';
import { getProfilesForUser } from '$lib/server/profileService.js';

/**
 * GET /api/profiles — list profiles in current family.
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function GET(event) {
	const session = await event.locals.auth();
	if (!session?.user?.authUserId) return json([]);
	const profiles = await getProfilesForUser(session.user.authUserId);
	return json(profiles);
}
