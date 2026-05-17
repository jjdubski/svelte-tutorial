import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthStore } from '../state/authStore.svelte.js';
import { storageGet } from '../scripts/storage.js';

// Mock @auth/sveltekit/client at top level so login/logout methods work in tests
vi.mock('@auth/sveltekit/client', () => ({
	signIn: vi.fn(),
	signOut: vi.fn()
}));

/**
 * Helper: create a minimal localStorage mock.
 */
function createMockLocalStorage(initialStore = {}) {
	const store = { ...initialStore };
	return {
		getItem: vi.fn((key) => store[key] ?? null),
		setItem: vi.fn((key, value) => {
			store[key] = String(value);
		}),
		removeItem: vi.fn((key) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			Object.keys(store).forEach((k) => delete store[k]);
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index) => Object.keys(store)[index] ?? null)
	};
}

describe('AuthStore', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createMockLocalStorage());
		vi.stubGlobal('fetch', vi.fn());
		vi.stubGlobal('window', { location: { href: '' } });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('constructor / _init', () => {
		it('sets isLoading to true initially and resolves', async () => {
			// Mock fetch to simulate no session
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				json: async () => ({})
			});

			const auth = new AuthStore();
			expect(auth.isLoading).toBe(true);

			// Wait for _fetchSession to resolve
			await vi.waitFor(() => {
				expect(auth.isLoading).toBe(false);
			});
		});

		it('falls back to guest mode when session fetch fails and authMode was guest', async () => {
			// Set up localStorage with guest mode BEFORE creating the store
			vi.unstubAllGlobals();
			const mockStore = { authMode: JSON.stringify('guest') };
			vi.stubGlobal('localStorage', createMockLocalStorage(mockStore));
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
			vi.stubGlobal('window', { location: { href: '' } });

			const auth = new AuthStore();
			expect(auth.isLoading).toBe(true);

			await vi.waitFor(() => {
				expect(auth.isLoading).toBe(false);
			});

			// Session fetch was attempted even though authMode was 'guest'
			expect(fetch).toHaveBeenCalledWith('/auth/session');
			// Falls back to guest mode when no session
			expect(auth.isGuest).toBe(true);
		});

		it('leaves guest mode marker when session is found (migration dialog handles clearing)', async () => {
			vi.unstubAllGlobals();
			const mockStore = { authMode: JSON.stringify('guest') };
			vi.stubGlobal('localStorage', createMockLocalStorage(mockStore));
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: async () => ({
						user: {
							authUserId: 'google-123',
							email: 'test@example.com',
							name: 'Test User'
						}
					})
				})
			);
			vi.stubGlobal('window', { location: { href: '' } });

			const auth = new AuthStore();

			await vi.waitFor(() => {
				expect(auth.isLoading).toBe(false);
			});

			// User is logged in, not guest
			expect(auth.isLoggedIn).toBe(true);
			expect(auth.isGuest).toBe(false);
			// authMode is NOT cleared here — it's left for the migration dialog to handle
			expect(localStorage.getItem('authMode')).toBe(JSON.stringify('guest'));
		});

		it('fetches session when no guest mode and logs in on valid session', async () => {
			const mockUser = {
				authUserId: 'google-123',
				email: 'test@example.com',
				name: 'Test User',
				picture: 'https://example.com/pic.jpg'
			};

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ user: mockUser })
			});

			const auth = new AuthStore();

			await vi.waitFor(() => {
				expect(auth.isLoading).toBe(false);
			});

			expect(fetch).toHaveBeenCalledWith('/auth/session');
			expect(auth.isLoggedIn).toBe(true);
			expect(auth.user).toEqual(mockUser);
		});

		it('handles session fetch failure gracefully', async () => {
			vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

			const auth = new AuthStore();

			await vi.waitFor(() => {
				expect(auth.isLoading).toBe(false);
			});

			expect(auth.isLoggedIn).toBe(false);
			expect(auth.user).toBeNull();
		});

		it('handles session fetch returning no user', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ user: null })
			});

			const auth = new AuthStore();

			await vi.waitFor(() => {
				expect(auth.isLoading).toBe(false);
			});

			expect(auth.isLoggedIn).toBe(false);
			expect(auth.user).toBeNull();
		});
	});

	describe('continueAsGuest', () => {
		it('sets authMode in localStorage and redirects to /tasks', () => {
			const auth = new AuthStore();

			// Reset loading to true for this test
			auth.isLoading = true;
			auth.isGuest = false;

			auth.continueAsGuest();

			expect(window.location.href).toBe('/tasks');
			expect(auth.isGuest).toBe(true);
			expect(auth.isLoading).toBe(false);
		});
	});

	describe('clearGuestMode', () => {
		it('removes authMode from localStorage and sets isGuest to false', () => {
			const auth = new AuthStore();

			// Set up guest-like state
			auth.isGuest = true;
			localStorage.setItem('authMode', JSON.stringify('guest'));

			auth.clearGuestMode();

			expect(auth.isGuest).toBe(false);
			expect(localStorage.getItem('authMode')).toBeNull();
		});
	});

	describe('login and logout', () => {
		it('login dynamically imports and calls signIn', async () => {
			const auth = new AuthStore();
			auth.isLoading = false;

			await auth.login('google');

			// The mock from vi.mock is hoisted, so signIn is already mocked
			const { signIn } = await import('@auth/sveltekit/client');
			expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/tasks' });
		});

		it('logout dynamically imports and calls signOut', async () => {
			const auth = new AuthStore();

			await auth.logout();

			const { signOut } = await import('@auth/sveltekit/client');
			expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
		});
	});

	// ---------------------------------------------------------------------------
	// Multi-profile switching — Credentials provider based
	// ---------------------------------------------------------------------------

	describe('switchToProfile', () => {
		it('calls signIn with account-switch provider with redirect:false', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = {
				authUserId: 'google-current',
				email: 'current@example.com',
				familyId: 'family-123'
			};

			const { signIn } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockResolvedValue({ ok: true });

			await auth.switchToProfile('google-target');

			expect(signIn).toHaveBeenCalledWith('account-switch', {
				targetAuthUserId: 'google-target',
				familyId: 'family-123',
				redirect: false
			});
		});

		it('re-fetches session and calls reloadTodos callback on successful switch', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = {
				authUserId: 'google-current',
				email: 'current@example.com',
				familyId: 'family-123'
			};

			const reloadTodos = vi.fn().mockResolvedValue(undefined);
			auth.setReloadTodos(reloadTodos);

			const { signIn } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockResolvedValue({ ok: true });

			const switchedUser = {
				authUserId: 'google-target',
				email: 'target@example.com',
				name: 'Target User',
				familyId: 'family-123'
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: switchedUser })
			});

			await auth.switchToProfile('google-target');

			// Session was re-fetched
			expect(fetch).toHaveBeenCalledWith('/auth/session');
			expect(auth.user).toEqual(switchedUser);

			// reloadTodos callback was called
			expect(reloadTodos).toHaveBeenCalledOnce();
		});

		it('returns early when no authUserId provided', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = { authUserId: 'google-current', familyId: 'family-123' };

			const { signIn } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockClear();

			await auth.switchToProfile('');

			expect(signIn).not.toHaveBeenCalled();
		});

		it('returns early when user has no familyId', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = { authUserId: 'google-current' };

			const { signIn } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockClear();

			await auth.switchToProfile('google-target');

			expect(signIn).not.toHaveBeenCalled();
		});

		it('does not update session when signIn fails', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = {
				authUserId: 'google-current',
				email: 'current@example.com',
				familyId: 'family-123'
			};

			const { signIn } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockResolvedValue({ ok: false, error: 'Access denied' });

			await auth.switchToProfile('google-target');

			// User should remain unchanged since signIn failed
			expect(auth.user?.authUserId).toBe('google-current');
		});
	});

	describe('addNewProfile', () => {
		it('sets _pendingProfileAction to "add"', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = { authUserId: 'google-current', email: 'current@example.com' };

			const { signIn, signOut } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockClear();
			vi.mocked(signOut).mockClear();

			await auth.addNewProfile();

			expect(storageGet('_pendingProfileAction')).toBe('add');
		});

		it('saves _pendingProfileFamilyId when user has familyId', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = { authUserId: 'google-current', email: 'current@example.com', familyId: 'family-123' };

			const { signIn, signOut } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockClear();
			vi.mocked(signOut).mockClear();

			await auth.addNewProfile();

			expect(storageGet('_pendingProfileFamilyId')).toBe('family-123');
		});

		it('does not save _pendingProfileFamilyId when user has no familyId', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = { authUserId: 'google-current', email: 'current@example.com' };

			const { signIn, signOut } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockClear();
			vi.mocked(signOut).mockClear();

			await auth.addNewProfile();

			expect(storageGet('_pendingProfileFamilyId')).toBeNull();
		});

		it('calls signOut then signIn without login_hint', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = { authUserId: 'google-current', email: 'current@example.com' };

			const { signIn, signOut } = await import('@auth/sveltekit/client');
			vi.mocked(signIn).mockClear();
			vi.mocked(signOut).mockClear();

			const callOrder = [];
			vi.mocked(signOut).mockImplementation(() => { callOrder.push('signOut'); });
			vi.mocked(signIn).mockImplementation(() => { callOrder.push('signIn'); });

			await auth.addNewProfile();

			expect(signOut).toHaveBeenCalledWith({ redirect: false });
			expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/profiles' });
			expect(callOrder).toEqual(['signOut', 'signIn']);
		});
	});

	describe('switchToGuest', () => {
		it('sets authMode to guest, signs out, and redirects to /tasks', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));
			auth.user = { authUserId: 'google-current', email: 'current@example.com' };

			const { signOut } = await import('@auth/sveltekit/client');
			vi.mocked(signOut).mockClear();

			await auth.switchToGuest();

			// authMode set to guest
			expect(storageGet('authMode')).toBe('guest');

			// signOut called
			expect(signOut).toHaveBeenCalledWith({ redirect: false });

			// Redirect
			expect(window.location.href).toBe('/tasks');
		});
	});

	describe('getSavedProfiles', () => {
		it('returns empty array when API returns no profiles', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => []
			});

			const result = await auth.getSavedProfiles();
			expect(result).toEqual([]);
		});

		it('returns profiles from API', async () => {
			const mockProfiles = [
				{ authUserId: 'google-123', email: 'a@b.com', name: 'A', lastUsed: 100 },
				{ authUserId: 'google-456', email: 'c@d.com', name: 'C', lastUsed: 200 }
			];

			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockProfiles
			});

			const result = await auth.getSavedProfiles();
			expect(fetch).toHaveBeenCalledWith('/api/profiles');
			expect(result).toEqual(mockProfiles);
		});

		it('returns empty array on fetch failure', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));

			vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

			const result = await auth.getSavedProfiles();
			expect(result).toEqual([]);
		});

		it('returns empty array when API returns non-ok status', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: 'Server error' })
			});

			const result = await auth.getSavedProfiles();
			expect(result).toEqual([]);
		});
	});

	describe('removeSavedProfile', () => {
		it('sends DELETE request for the correct authUserId', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));

			await auth.removeSavedProfile('google-222');

			expect(fetch).toHaveBeenCalledWith(
				'/api/profiles/google-222',
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('handles remove gracefully when fetch fails', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));

			vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

			// Should not throw
			await expect(auth.removeSavedProfile('google-222')).resolves.toBeUndefined();
		});

		it('handles API error response gracefully', async () => {
			const auth = new AuthStore();
			await vi.waitFor(() => expect(auth.isLoading).toBe(false));

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({})
			});

			// Should not throw when API returns non-ok
			await expect(auth.removeSavedProfile('nonexistent')).resolves.toBeUndefined();
		});
	});
});
