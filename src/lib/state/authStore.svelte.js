import { createContext } from 'svelte';
import { storageGet, storageSet, storageRemove } from '$lib/scripts/storage.js';

class AuthStore {
	/** @type {import('@auth/sveltekit').Session | null} */
	user = $state(null);
	/** @type {boolean} */
	isLoggedIn = $state(false);
	/** @type {boolean} */
	isLoading = $state(true);
	/** @type {boolean} */
	isGuest = $state(false);
	/** @type {(() => Promise<void>) | null} */
	_reloadTodos = null;

	constructor() {
		this._init();
	}

	/**
	 * Register a callback to reload todo data after a profile switch.
	 * Must be called from a component context (where getContext is valid).
	 * @param {() => Promise<void>} fn
	 */
	setReloadTodos(fn) {
		this._reloadTodos = fn;
	}

	_init() {
		// Always try to fetch the session first — don't short-circuit on guest mode,
		// because the user may have authenticated since the last visit.
		const wasGuest = storageGet('authMode') === 'guest';
		this._fetchSession(wasGuest);
	}

	/**
	 * Fetch the session from the server.
	 * If a valid session exists, the user is logged in.
	 * If no session and the user was previously in guest mode, fall back to guest behavior.
	 *
	 * NOTE: We do NOT clear `authMode` here — the migration dialog handles that
	 * after it has had a chance to read the 'guest' marker and offer data migration.
	 * @param {boolean} wasGuest
	 */
	async _fetchSession(wasGuest) {
		try {
			const res = await fetch('/auth/session');
			if (res.ok) {
				const data = await res.json();
				if (data?.user) {
					this.user = data.user;
					this.isLoggedIn = true;
					this.isLoading = false;

					// Sync profile_family_id cookie for multi-account linking.
					// This is a fire-and-forget idempotent call — always run it
					// because HttpOnly cookies are invisible to document.cookie.
					if (data.user.familyId) {
						fetch('/api/profiles/family-sync', { method: 'POST' }).catch(() => {});
					}

					return;
				}
			}
		} catch {
			// Session fetch failed (offline or not logged in)
		}

		// No valid session found
		if (wasGuest) {
			this.isGuest = true;
		}
		this.isLoading = false;
	}

	/**
	 * Sign in with an OAuth provider.
	 * @param {string} provider
	 */
	async login(provider) {
		const { signIn } = await import('@auth/sveltekit/client');
		await signIn(provider, { callbackUrl: '/tasks' });
	}

	async logout() {
		const { signOut } = await import('@auth/sveltekit/client');
		await signOut({ callbackUrl: '/' });
	}

	/**
	 * Switch to a different profile in the same family.
	 * Uses Auth.js Credentials provider (redirect: false) to mint a new session
	 * for the target profile without navigating to a sign-in page.
	 * @param {string} authUserId
	 */
	async switchToProfile(authUserId) {
		if (!authUserId || !this.user?.familyId) return;
		const { signIn } = await import('@auth/sveltekit/client');
		const result = await signIn('account-switch', {
			targetAuthUserId: authUserId,
			familyId: this.user.familyId,
			redirect: false
		});

		if (result?.ok) {
			// Session cookie has been updated server-side — re-fetch to sync client state
			try {
				const res = await fetch('/auth/session');
				if (res.ok) {
					const data = await res.json();
					if (data?.user) {
						this.user = data.user;
						this.isLoggedIn = true;
						this.isGuest = false;
					}
				}
			} catch {
				// Session fetch failed — page reload will recover
			}

			// Reload todo data to reflect the switched profile's content
			// Uses the callback wired from +layout.svelte (component context) to avoid
			// calling getContext() outside component initialization.
			await this._reloadTodos?.();
		}
	}

	async addNewProfile() {
		storageSet('_pendingProfileAction', 'add');

		// Save the current user's familyId so the new account can be linked
		// to the same family after the OAuth flow completes.
		if (this.user?.familyId) {
			storageSet('_pendingProfileFamilyId', this.user.familyId);
		}

		const { signIn, signOut } = await import('@auth/sveltekit/client');
		await signOut({ redirect: false });
		await signIn('google', { callbackUrl: '/profiles' });
	}

	async switchToGuest() {
		storageSet('authMode', 'guest');

		const { signOut } = await import('@auth/sveltekit/client');
		await signOut({ redirect: false });
		window.location.href = '/tasks';
	}

	async getSavedProfiles() {
		try {
			const res = await fetch('/api/profiles');
			if (!res.ok) return [];
			return await res.json();
		} catch {
			return [];
		}
	}

	async removeSavedProfile(authUserId) {
		try {
			await fetch(`/api/profiles/${encodeURIComponent(authUserId)}`, { method: 'DELETE' });
		} catch {
			// ignore
		}
	}

	continueAsGuest() {
		storageSet('authMode', 'guest');
		this.isGuest = true;
		this.isLoading = false;
		window.location.href = '/tasks';
	}

	clearGuestMode() {
		storageRemove('authMode');
		this.isGuest = false;
	}
}

/** @typedef {InstanceType<typeof AuthStore>} AuthStoreType */

export const [getAuthStore, setAuthStore] = createContext /** @type {AuthStoreType} */();

/**
 * Factory function to create a new AuthStore instance and set it in context.
 * @returns {AuthStoreType}
 */
export function createAuthStore() {
	const store = new AuthStore();
	setAuthStore(store);
	return store;
}

export { AuthStore };
