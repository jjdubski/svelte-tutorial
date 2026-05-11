import { json, error } from '@sveltejs/kit';
import { importData } from '$lib/server/todoService.js';

/**
 * POST /api/todos/import — Bulk-import todos, archivedTodos, customTags, and tagColors.
 * Existing items are updated by matching ID; new items are appended.
 * Requires authentication.
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function POST(event) {
	try {
		const session = await event.locals.auth();
		if (!session?.user?.authUserId) {
			return error(401, 'Unauthorized');
		}

		const data = await event.request.json();
		await importData(session.user.authUserId, data);
		return json({ success: true });
	} catch (err) {
		console.error('[api] POST /api/todos/import failed:', err);
		return error(500, 'Internal server error');
	}
}
