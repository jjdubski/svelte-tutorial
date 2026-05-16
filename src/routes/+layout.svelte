<script>
	import '../app.css';
	import { fade } from 'svelte/transition';
	import { createTodoStore } from '$lib/state/todoStore.svelte.js';
	import { createAuthStore } from '$lib/state/authStore.svelte.js';
	import { createThemeStore } from '$lib/state/themeStore.svelte.js';
	import { storageGet } from '$lib/scripts/storage.js';
	import { materialEasing } from '$lib/utils/motion.js';
	import { page } from '$app/stores';
	import NavBar from '$lib/components/NavBar.svelte';
	import MigrationDialog from '$lib/components/MigrationDialog.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import HelpButton from '$lib/components/HelpButton.svelte';

	let { children } = $props();

	// Initialize stores and wire auth into todo store for API sync
	const _todoStore = createTodoStore();
	const _authStore = createAuthStore();
	createThemeStore(_authStore);
	_todoStore.setAuthStore(_authStore);

	let attemptedBackgroundSync = $state(false);

	async function registerBackgroundSync() {
		if (typeof window === 'undefined') return;
		if ('serviceWorker' in navigator && 'PeriodicSyncManager' in window) {
			try {
				const registration = await navigator.serviceWorker.ready;
				await registration.periodicSync.register('overdue-check', {
					minInterval: 24 * 60 * 60 * 1000
				});
			} catch {
				// PeriodicSync not supported or permission denied
			}
		}
	}

	// If the user has local data (todos in localStorage), the MigrationDialog handles
	// syncing it to the server and then calls loadFromApi. If there's no local data,
	// or the data was already synced in a previous session, load directly from the
	// server so the user sees their account data.
	$effect(() => {
		if (!_authStore.isLoading && _authStore.isLoggedIn && !_authStore.isGuest) {
			const wasGuest = storageGet('authMode') === 'guest';
			const hasGuestData =
				(storageGet('todos') || []).length > 0 || (storageGet('archivedTodos') || []).length > 0;

			// Only pause auto-load when we specifically have guest data to migrate.
			if (!wasGuest || !hasGuestData) {
				_todoStore.loadFromApi();
			}
		}
	});

	$effect(() => {
		if (!_authStore.isLoading && _authStore.isLoggedIn && !attemptedBackgroundSync) {
			attemptedBackgroundSync = true;
			void registerBackgroundSync();
		}
	});
</script>

{#if !$page.error}
	<NavBar />
{/if}
<main id="main-content">
	{#key $page.url.pathname}
		<div
			transition:fade={{
				duration: _todoStore.prefersReducedMotion ? 0 : 200,
				easing: materialEasing
			}}
		>
			{@render children()}
		</div>
	{/key}
</main>
{#if _todoStore.toast.show}
	<Toast />
{/if}
<MigrationDialog />
<InstallPrompt />
<HelpButton />
