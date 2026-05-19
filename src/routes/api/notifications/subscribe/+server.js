import { json } from '@sveltejs/kit';
import { User } from '$lib/server/models/User.js';
import { connectDB } from '$lib/server/db.js';

/**
 * POST /api/notifications/subscribe
 * Store a push subscription for the authenticated user.
 */
export async function POST({ locals, request }) {
	const session = await locals.getSession();
	if (!session?.user?.authUserId) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const { subscription } = await request.json();

		if (!subscription || !subscription.endpoint) {
			return json({ error: 'Invalid subscription' }, { status: 400 });
		}

		await connectDB();

		// Store subscription in user settings
		await User.findOneAndUpdate(
			{ authUserId: session.user.authUserId },
			{
				$set: {
					'settings.pushSubscription': subscription,
					'settings.notificationsEnabled': true
				}
			}
		);

		return json({ success: true });
	} catch (err) {
		console.error('[api/notifications/subscribe] POST error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

/**
 * DELETE /api/notifications/subscribe
 * Remove a push subscription for the authenticated user.
 */
export async function DELETE({ locals, request }) {
	const session = await locals.getSession();
	if (!session?.user?.authUserId) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		await request.json();

		await connectDB();

		// Remove subscription from user settings
		await User.findOneAndUpdate(
			{ authUserId: session.user.authUserId },
			{
				$unset: {
					'settings.pushSubscription': '',
					'settings.notificationsEnabled': ''
				}
			}
		);

		return json({ success: true });
	} catch (err) {
		console.error('[api/notifications/subscribe] DELETE error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
