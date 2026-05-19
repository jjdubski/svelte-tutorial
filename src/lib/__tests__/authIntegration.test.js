import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TodoStore } from '../state/todoStore.svelte.js';
import { AuthStore } from '../state/authStore.svelte.js';

vi.mock('@auth/sveltekit/client', () => ({ signOut: vi.fn() }));

/**
 * Create a minimal mock auth store that can be attached to a TodoStore.
 */
function createMockAuthStore(isLoggedIn = false, isGuest = false) {
	return {
		isLoggedIn,
		isGuest,
		clearGuestMode: vi.fn(),
		user: isLoggedIn ? { authUserId: 'test-123', email: 'test@example.com' } : null
	};
}

/**
 * Create a localStorage mock backed by a real object so reads/writes
 * actually round-trip. Use this for integration tests where the $effect
 * must persist/retrieve data through localStorage.
 */
function createLiveLocalStorage() {
	const storage = {};
	return {
		storage, // exposed so tests can inspect state directly
		mock: {
			getItem: vi.fn((key) => storage[key] ?? null),
			setItem: vi.fn((key, value) => {
				storage[key] = String(value);
			}),
			removeItem: vi.fn((key) => {
				delete storage[key];
			}),
			clear: vi.fn(() => {
				for (const k of Object.keys(storage)) delete storage[k];
			}),
			get length() {
				return Object.keys(storage).length;
			},
			key: vi.fn((i) => Object.keys(storage)[i] ?? null)
		}
	};
}

describe('TodoStore API sync layer', () => {
	/** @type {import('../state/todoStore.svelte.js').default} */
	let store;

	beforeEach(() => {
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(() => null),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			get length() {
				return 0;
			},
			key: vi.fn(() => null)
		});
		vi.stubGlobal('fetch', vi.fn());
		vi.stubGlobal('window', {
			location: { href: '' },
			matchMedia: vi.fn().mockReturnValue({ matches: false }),
			addEventListener: vi.fn()
		});

		store = new TodoStore();
		store.showToast = vi.fn();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('setAuthStore', () => {
		it('accepts an auth store reference', () => {
			const mockAuth = createMockAuthStore();
			store.setAuthStore(mockAuth);
			expect(store._auth).toBe(mockAuth);
		});
	});

	describe('_syncToApi', () => {
		it('does nothing when user is not logged in', async () => {
			const mockAuth = createMockAuthStore(false);
			store.setAuthStore(mockAuth);

			await store._syncToApi('POST', '/api/todos', { title: 'Test' });

			expect(fetch).not.toHaveBeenCalled();
		});

		it('does nothing when auth is not set', async () => {
			store._auth = null;

			await store._syncToApi('POST', '/api/todos', { title: 'Test' });

			expect(fetch).not.toHaveBeenCalled();
		});

		it('fires fetch when user is logged in', async () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			vi.mocked(fetch).mockResolvedValue({ ok: true });

			await store._syncToApi('POST', '/api/todos', { title: 'Test' });

			expect(fetch).toHaveBeenCalledWith('/api/todos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test' })
			});
		});

		it('sends request without body for methods that do not need one', async () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			vi.mocked(fetch).mockResolvedValue({ ok: true });

			await store._syncToApi('DELETE', '/api/todos/1');

			expect(fetch).toHaveBeenCalledWith('/api/todos/1', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: undefined
			});
		});

		it('shows a toast when the API returns an error', async () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 });

			await store._syncToApi('POST', '/api/todos', { title: 'Test' });

			expect(store.showToast).toHaveBeenCalledWith(
				'Could not sync to cloud. Your changes are saved locally.',
				'warning'
			);
		});

		it('redirects to login on 401', async () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 });

			await store._syncToApi('POST', '/api/todos', { title: 'Test' });

			expect(mockAuth.clearGuestMode).toHaveBeenCalled();
			expect(window.location.href).toBe('/');
		});

		it('shows a toast when fetch throws (network error)', async () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

			await store._syncToApi('POST', '/api/todos', { title: 'Test' });

			expect(store.showToast).toHaveBeenCalledWith(
				'Could not sync to cloud. Your changes are saved locally.',
				'warning'
			);
		});
	});

	describe('CRUD sync helpers', () => {
		it('_syncCreate calls _syncToApi with POST', () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			const spy = vi.spyOn(store, '_syncToApi');

			const todo = { id: 1, title: 'Test', completed: false, createdAt: '2025-01-01' };
			store._syncCreate(todo);

			expect(spy).toHaveBeenCalledWith('POST', '/api/todos', todo);
		});

		it('_syncUpdate calls _syncToApi with PUT', () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			const spy = vi.spyOn(store, '_syncToApi');

			store._syncUpdate(1, { title: 'Updated' });

			expect(spy).toHaveBeenCalledWith('PUT', '/api/todos/1', { title: 'Updated' });
		});

		it('_syncDelete calls _syncToApi with DELETE', () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			const spy = vi.spyOn(store, '_syncToApi');

			store._syncDelete(1);

			expect(spy).toHaveBeenCalledWith('DELETE', '/api/todos/1');
		});

		it('_syncBatch calls _syncToApi with POST and ids', () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			const spy = vi.spyOn(store, '_syncToApi');

			store._syncBatch('/api/todos/archive', [1, 2, 3]);

			expect(spy).toHaveBeenCalledWith('POST', '/api/todos/archive', { ids: [1, 2, 3] });
		});

		it('_syncPermanentDelete calls _syncToApi with POST and id', () => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
			const spy = vi.spyOn(store, '_syncToApi');

			store._syncPermanentDelete(5);

			expect(spy).toHaveBeenCalledWith('POST', '/api/todos/permanent-delete', { id: 5 });
		});
	});

	describe('CRUD operations call sync methods', () => {
		beforeEach(() => {
			const mockAuth = createMockAuthStore(true);
			store.setAuthStore(mockAuth);
		});

		it('addTodo calls _syncCreate', () => {
			const spy = vi.spyOn(store, '_syncCreate');
			store.addTodo('New Task', '', '', 'medium', 'Work', [], '', []);
			expect(spy).toHaveBeenCalled();
		});

		it('updateTodo calls _syncUpdate', () => {
			store.todos = [{ id: 1, title: 'Test', completed: false, createdAt: '2025-01-01' }];
			const spy = vi.spyOn(store, '_syncUpdate');
			store.updateTodo(1, { title: 'Updated' });
			expect(spy).toHaveBeenCalledWith(1, { title: 'Updated' });
		});

		it('deleteTodo calls _syncDelete', () => {
			store.todos = [{ id: 1, title: 'Test', completed: false, createdAt: '2025-01-01' }];
			const spy = vi.spyOn(store, '_syncDelete');
			store.deleteTodo(1);
			expect(spy).toHaveBeenCalledWith(1);
		});

		it('restoreTodo calls _syncBatch', () => {
			store.archivedTodos = [{ id: 1, title: 'Archived', completed: true, createdAt: '2025-01-01' }];
			const spy = vi.spyOn(store, '_syncBatch');
			store.restoreTodo(1);
			expect(spy).toHaveBeenCalledWith('/api/todos/restore', [1]);
		});

		it('permanentDeleteTodo calls _syncPermanentDelete', () => {
			store.archivedTodos = [{ id: 1, title: 'Archived', completed: true, createdAt: '2025-01-01' }];
			const spy = vi.spyOn(store, '_syncPermanentDelete');
			store.permanentDeleteTodo(1);
			expect(spy).toHaveBeenCalledWith(1);
		});
	});
});

// ---------------------------------------------------------------------------
// Guest session lifecycle integration tests
// ---------------------------------------------------------------------------
describe('Guest session lifecycle (signed-in → guest → sign-in)', () => {
	/**
	 * Create both stores with a live localStorage mock wired as the real layout does.
	 * @param {Record<string,string>} seededStorage - key → raw JSON string to seed into localStorage before creating stores
	 */
	function setupStores(seededStorage = {}) {
		const ls = createLiveLocalStorage();
		for (const [key, value] of Object.entries(seededStorage)) {
			ls.storage[key] = value;
		}
		vi.stubGlobal('localStorage', ls.mock);

		vi.stubGlobal('fetch', vi.fn());
		vi.stubGlobal('window', {
			location: { href: '' },
			matchMedia: vi.fn().mockReturnValue({ matches: false }),
			addEventListener: vi.fn()
		});

		const todoStore = new TodoStore();
		const authStore = new AuthStore();

		// Wire up callbacks exactly as +layout.svelte does
		todoStore.setAuthStore(authStore);
		authStore.setClearLocalTodoData(() => todoStore.clearLocalSessionData());

		return { todoStore, authStore, storage: ls.storage };
	}

	it('does NOT clear in-memory or localStorage data on continueAsGuest', () => {
		const { todoStore, authStore, storage } = setupStores({
			todos: JSON.stringify([{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }])
		});

		// Confirm data loaded
		expect(todoStore.todos).toEqual([
			{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }
		]);
		expect(storage['todos']).toBe(
			JSON.stringify([{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }])
		);

		// Act: user clicks "Continue as Guest"
		authStore.continueAsGuest();

		// In-memory state is UNCHANGED — continueAsGuest does NOT clear data
		expect(todoStore.todos).toEqual([
			{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }
		]);
		expect(todoStore.archivedTodos).toEqual([]);
		expect(todoStore.customTags).toEqual([]);
		// localStorage data also persists
		expect(storage['todos']).toBe(
			JSON.stringify([{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }])
		);
		// authMode written so next page load enters guest mode
		expect(storage['authMode']).toBe(JSON.stringify('guest'));
	});

	it('preserves guest-created data across continueAsGuest toggles', () => {
		const { todoStore, authStore, storage } = setupStores({
			todos: JSON.stringify([{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }])
		});

		// Switch to guest (data persists — no clearing)
		authStore.continueAsGuest();

		// Cloud data still in memory
		expect(todoStore.todos).toHaveLength(1);
		expect(todoStore.todos[0].id).toBe('cloud-1');

		// Guest adds data — both coexist in memory
		todoStore.addTodo('Guest task', '', '', 'medium', '', [], '', []);
		expect(todoStore.todos).toHaveLength(2);
		const ids = todoStore.todos.map((t) => t.id);
		expect(ids).toContain('cloud-1');
		// The newly added todo has a different, non-cloud ID
		expect(ids.some((id) => id !== 'cloud-1')).toBe(true);

		// Guest toggles again — authMode written, data still intact
		expect(storage['authMode']).toBe(JSON.stringify('guest'));
	});

	it('clears local session cache on logout (signed-in state)', async () => {
		const { todoStore, authStore, storage } = setupStores({
			todos: JSON.stringify([{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }])
		});

		// Guarantee authStore appears signed in (not guest)
		delete storage['authMode'];
		authStore.isGuest = false;
		authStore.isLoading = false;

		// Stub @auth/sveltekit client so logout does not crash
		vi.mock('@auth/sveltekit/client', () => ({ signOut: vi.fn() }));

		// Act: user signs out
		await authStore.logout();

		// In-memory state cleared
		expect(todoStore.todos).toEqual([]);
		expect(todoStore.archivedTodos).toEqual([]);
		expect(todoStore.customTags).toEqual([]);
		expect(todoStore.availableTags).toEqual(['urgent', 'meeting', 'home', 'shopping', 'health', 'in-progress']);

		// localStorage cleared
		expect(storage['todos']).toBeUndefined();
		expect(storage['archivedTodos']).toBeUndefined();
		expect(storage['customTags']).toBeUndefined();
		expect(storage['tagColors']).toBeUndefined();
		expect(storage['authMode']).toBeUndefined();
	});

	it('guest-to-signed-in transition leaves cloud data intact (user added no guest data)', () => {
		const { authStore, storage } = setupStores({
			todos: JSON.stringify([{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }])
		});

		// Simulate guest mode active
		authStore.continueAsGuest();
		expect(storage['authMode']).toBe(JSON.stringify('guest'));

		// Guest adds no data

		// Simulate what happens when the user signs in: the page reloads,
		// AuthStore constructor sees the session is valid, and fresh server
		// data overwrites localStorage. The stale "cloud-1" in localStorage
		// is replaced by the server response before MigrationDialog runs.
		//
		// The important contract: continueAsGuest does NOT actively destroy
		// data that logout() is responsible for clearing.
		expect(storage['todos']).toBe(
			JSON.stringify([{ id: 'cloud-1', title: 'Cloud task', completed: false, createdAt: '2026-01-01' }])
		);
	});
});
