import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeStore } from '../state/themeStore.svelte.js';

describe('ThemeStore', () => {
	beforeEach(() => {
		const storage = {};

		vi.stubGlobal('localStorage', {
			getItem: vi.fn((key) => (key in storage ? storage[key] : null)),
			setItem: vi.fn((key, value) => {
				storage[key] = String(value);
			}),
			removeItem: vi.fn((key) => {
				delete storage[key];
			}),
			clear: vi.fn(() => {
				for (const key of Object.keys(storage)) delete storage[key];
			})
		});

		vi.stubGlobal('window', {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		});

		const style = {
			setProperty: vi.fn()
		};

		vi.stubGlobal('document', {
			documentElement: {
				style
			}
		});

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ settings: {} }) }));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('initializes with default theme values', () => {
		const auth = { isLoggedIn: false };
		const store = new ThemeStore(auth);

		expect(store.themePreset).toBe('default');
		expect(store.accentColor).toBe('#3b82f6');
		expect(store.fontFamily).toBe('system-ui');
	});

	it('accepts custom preset and custom colors', () => {
		const auth = { isLoggedIn: false };
		const store = new ThemeStore(auth);

		store.themePreset = 'custom';
		store.accentColor = '#ff00aa';
		store.bgColor = '#ffffff';
		store.cardColor = '#f8fafc';
		store.textColor = '#1e293b';
		store.borderColor = '#e2e8f0';

		expect(store.themePreset).toBe('custom');
		expect(store.accentColor).toBe('#ff00aa');
	});

	it('loads saved preset and font from localStorage', () => {
		localStorage.setItem('themePreset', JSON.stringify('ocean'));
		localStorage.setItem('fontFamily', JSON.stringify('mono'));

		const auth = { isLoggedIn: false };
		const store = new ThemeStore(auth);

		expect(store.themePreset).toBe('ocean');
		expect(store.fontFamily).toBe('mono');
	});
});
