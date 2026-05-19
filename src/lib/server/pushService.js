import { User } from '../models/User.js';
import { connectDB } from '../db.js';

/**
 * Send a push notification to a specific user.
 * @param {string} authUserId - The user's auth ID
 * @param {Object} notification - The notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body text
 * @param {string} [notification.icon] - Icon URL
 * @param {string} [notification.tag] - Notification tag for grouping
 * @param {Object} [notification.data] - Additional data to pass with notification
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
export async function sendPushNotification(authUserId, notification) {
	try {
		await connectDB();

		const user = await User.findOne({ authUserId }).select('settings.pushSubscription').lean();

		if (!user?.settings?.pushSubscription) {
			console.log(`[push] No push subscription for user ${authUserId}`);
			return false;
		}

		const subscription = user.settings.pushSubscription;

		// Web Push requires VAPID keys - these should be set in environment
		const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
		const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

		if (!vapidPublicKey || !vapidPrivateKey) {
			console.warn('[push] VAPID keys not configured, skipping push notification');
			return false;
		}

		// Use the Web Push API to send the notification
		const webPush = await import('web-push');

		webPush.setVapidDetails('mailto:admin@example.com', vapidPublicKey, vapidPrivateKey);

		const payload = JSON.stringify({
			title: notification.title || 'Svelte Todo',
			body: notification.body,
			icon: notification.icon || '/app-icon-192.png',
			badge: notification.badge || '/app-icon-192.png',
			tag: notification.tag || 'todo-notification',
			data: notification.data || {},
			actions: [
				{ action: 'view', title: 'View Tasks' },
				{ action: 'dismiss', title: 'Dismiss' }
			]
		});

		await webPush.sendNotification(subscription, payload);
		console.log(`[push] Sent notification to user ${authUserId}`);
		return true;
	} catch (err) {
		console.error(`[push] Failed to send notification to user ${authUserId}:`, err);

		// If subscription is no longer valid (e.g., user cleared browser data), remove it
		if (err.statusCode === 410) {
			await User.findOneAndUpdate(
				{ authUserId },
				{ $unset: { 'settings.pushSubscription': '', 'settings.notificationsEnabled': '' } }
			);
		}

		return false;
	}
}

/**
 * Check for overdue tasks and send push notifications to users who have them.
 * This should be called periodically (e.g., via cron job or scheduled function).
 */
export async function checkAndNotifyOverdueTasks() {
	try {
		await connectDB();

		const today = new Date().toISOString().split('T')[0];

		// Find all users with todos
		const users = await User.find({
			'todos.0': { $exists: true },
			'settings.notificationsEnabled': true
		})
			.select('authUserId todos settings.pushSubscription')
			.lean();

		let notifiedCount = 0;

		for (const user of users) {
			if (!user.settings?.pushSubscription) continue;

			// Find overdue tasks
			const overdue = user.todos.filter((t) => !t.completed && t.dueDate && t.dueDate < today);

			if (overdue.length > 0) {
				const body = `You have ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}:\n${overdue
					.slice(0, 3)
					.map((t) => '• ' + t.title)
					.join('\n')}`;

				const sent = await sendPushNotification(user.authUserId, {
					title: 'Overdue Tasks',
					body,
					tag: 'overdue-tasks',
					data: { type: 'overdue', count: overdue.length }
				});

				if (sent) notifiedCount++;
			}
		}

		console.log(`[push] Notified ${notifiedCount} users about overdue tasks`);
		return notifiedCount;
	} catch (err) {
		console.error('[push] Failed to check overdue tasks:', err);
		return 0;
	}
}

/**
 * Check for tasks due today and send push notifications to users.
 */
export async function checkAndNotifyDueTodayTasks() {
	try {
		await connectDB();

		const today = new Date().toISOString().split('T')[0];

		// Find all users with todos
		const users = await User.find({
			'todos.0': { $exists: true },
			'settings.notificationsEnabled': true
		})
			.select('authUserId todos settings.pushSubscription')
			.lean();

		let notifiedCount = 0;

		for (const user of users) {
			if (!user.settings?.pushSubscription) continue;

			// Find tasks due today
			const dueToday = user.todos.filter((t) => !t.completed && t.dueDate === today);

			if (dueToday.length > 0) {
				const body = `You have ${dueToday.length} task${dueToday.length === 1 ? '' : 's'} due today:\n${dueToday
					.slice(0, 3)
					.map((t) => '• ' + t.title)
					.join('\n')}`;

				const sent = await sendPushNotification(user.authUserId, {
					title: 'Tasks Due Today',
					body,
					tag: 'due-today',
					data: { type: 'due-today', count: dueToday.length }
				});

				if (sent) notifiedCount++;
			}
		}

		console.log(`[push] Notified ${notifiedCount} users about tasks due today`);
		return notifiedCount;
	} catch (err) {
		console.error('[push] Failed to check due-today tasks:', err);
		return 0;
	}
}
