/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// @ts-ignore - precaching manifest is injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Cache pages with NetworkFirst
registerRoute(
	({ request }) => request.mode === 'navigate',
	new NetworkFirst({
		cacheName: 'pages',
		plugins: [
			new ExpirationPlugin({
				maxEntries: 20,
				maxAgeSeconds: 24 * 60 * 60
			})
		]
	})
);

// Cache static assets with CacheFirst
registerRoute(
	({ request }) =>
		request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
	new CacheFirst({
		cacheName: 'static-assets',
		plugins: [
			new ExpirationPlugin({
				maxEntries: 60,
				maxAgeSeconds: 30 * 24 * 60 * 60
			})
		]
	})
);

// ── Push Notification Handler ──

self.addEventListener('push', (event) => {
	if (!event.data) return;

	let payload;
	try {
		payload = event.data.json();
	} catch {
		payload = { title: 'Svelte Todo', body: event.data.text() };
	}

	const {
		title = 'Svelte Todo',
		body,
		icon = '/app-icon-192.png',
		badge = '/app-icon-192.png',
		tag = 'todo-notification',
		data = {}
	} = payload;

	const options = {
		body,
		icon,
		badge,
		tag,
		data,
		actions: [
			{ action: 'view', title: 'View Tasks' },
			{ action: 'dismiss', title: 'Dismiss' }
		],
		renotify: true,
		requireInteraction: false
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Handler ──

self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	if (event.action === 'dismiss') return;

	// Open or focus the app
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url.includes('/') && 'focus' in client) {
					return client.focus();
				}
			}
			return clients.openWindow('/');
		})
	);
});

// ── Periodic Sync Handler ──

self.addEventListener('periodicsync', (event) => {
	if (event.tag === 'overdue-check') {
		event.waitUntil(checkOverdueTasks());
	}
});

async function checkOverdueTasks() {
	try {
		// Fetch tasks from API to check for overdue items
		const response = await fetch('/api/todos', {
			credentials: 'include',
			cache: 'no-cache'
		});

		if (!response.ok) return;

		const todos = await response.json();
		const today = new Date().toISOString().split('T')[0];
		const overdue = todos.filter((t) => !t.completed && t.dueDate && t.dueDate < today);

		if (overdue.length > 0) {
			// Check if we already notified today using IndexedDB
			const cache = await caches.open('notification-cache');
			const cacheKey = '/last-overdue-notification';
			const cached = await cache.match(cacheKey);

			let shouldNotify = true;
			if (cached) {
				const cachedData = await cached.json();
				const lastDate = cachedData.date;
				const lastHash = cachedData.hash;
				const currentHash = overdue
					.map((t) => t.id)
					.sort()
					.join(',');

				// Only notify if it's a new day or tasks changed
				shouldNotify = lastDate !== today || currentHash !== lastHash;
			}

			if (shouldNotify) {
				const body = `You have ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}:\n${overdue
					.slice(0, 3)
					.map((t) => '• ' + t.title)
					.join('\n')}`;

				await self.registration.showNotification('Overdue Tasks', {
					body,
					icon: '/app-icon-192.png',
					badge: '/app-icon-192.png',
					tag: 'overdue-tasks',
					renotify: true,
					requireInteraction: false,
					actions: [
						{ action: 'view', title: 'View Tasks' },
						{ action: 'dismiss', title: 'Dismiss' }
					]
				});

				// Cache the notification date and hash
				const response = new Response(
					JSON.stringify({
						date: today,
						hash: overdue
							.map((t) => t.id)
							.sort()
							.join(',')
					}),
					{ headers: { 'Content-Type': 'application/json' } }
				);
				await cache.put(cacheKey, response);
			}
		}
	} catch (err) {
		console.error('[SW] Periodic sync check failed:', err);
	}
}

// ── Service Worker Lifecycle ──

self.addEventListener('install', (_event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});
