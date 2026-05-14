import { describe, it, expect } from 'vitest';
import { SvelteSet } from 'svelte/reactivity';
import { initSelection, handleSelectionClick, clearSelection } from '../utils/selection.js';

// ── Helpers ──

/**
 * Create a minimal mock event object with the given overrides.
 * Defaults to a plain click (no modifiers).
 * @param {Partial<{ctrlKey: boolean, metaKey: boolean, shiftKey: boolean}>} [overrides]
 * @returns {{ ctrlKey: boolean, metaKey: boolean, shiftKey: boolean }}
 */
function mockEvent(overrides = {}) {
	return {
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
		...overrides
	};
}

/**
 * Create a mock store with the given todos and archivedTodos.
 * @param {Array<{id: string}>} [todos]
 * @param {Array<{id: string}>} [archivedTodos]
 * @returns {{ todos: Array, archivedTodos: Array, selectedTodos: SvelteSet, selectedArchived: SvelteSet }}
 */
function createStore(todos = [], archivedTodos = []) {
	return {
		todos,
		archivedTodos,
		selectedTodos: new SvelteSet(),
		selectedArchived: new SvelteSet()
	};
}

/**
 * Create a lastClickedState object.
 * @param {string|null} id
 * @returns {{ lastClickedId: string|null }}
 */
function createLastClickedState(id = null) {
	return { lastClickedId: id };
}

// ── initSelection ──

describe('initSelection()', () => {
	it('returns an object with lastClickedId set to null', () => {
		const result = initSelection();
		expect(result).toEqual({ lastClickedId: null });
	});

	it('returns a new object each call (no shared mutation)', () => {
		const a = initSelection();
		const b = initSelection();
		expect(a).not.toBe(b);
	});
});

// ── handleSelectionClick: meta/ctrl+click (toggle) ──

describe('handleSelectionClick — meta/ctrl+click (toggle)', () => {
	it('adds a todo to the selection set when not already selected', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1', '2']);

		const lastClicked = createLastClickedState('2');

		handleSelectionClick(mockEvent({ metaKey: true }), { id: '3' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('1')).toBe(true);
		expect(store.selectedTodos.has('2')).toBe(true);
		expect(store.selectedTodos.has('3')).toBe(true);
		expect(store.selectedTodos.size).toBe(3);
	});

	it('removes a todo from the selection set when already selected', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1', '2', '3']);

		const lastClicked = createLastClickedState('1');

		handleSelectionClick(mockEvent({ metaKey: true }), { id: '2' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('1')).toBe(true);
		expect(store.selectedTodos.has('2')).toBe(false);
		expect(store.selectedTodos.has('3')).toBe(true);
		expect(store.selectedTodos.size).toBe(2);
	});

	it('preserves other selected items (does not clear them)', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1', '5']);

		const lastClicked = createLastClickedState('1');

		// Ctrl-click an unselected item
		handleSelectionClick(mockEvent({ ctrlKey: true }), { id: '3' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('1')).toBe(true);
		expect(store.selectedTodos.has('5')).toBe(true);
		expect(store.selectedTodos.has('3')).toBe(true);
		expect(store.selectedTodos.size).toBe(3);
	});

	it('toggles using ctrlKey (alternative to metaKey)', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1']);

		const lastClicked = createLastClickedState('1');

		handleSelectionClick(mockEvent({ ctrlKey: true }), { id: '1' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('1')).toBe(false);
		expect(store.selectedTodos.size).toBe(0);
	});

	it('updates lastClickedId after toggle', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet([]);

		const lastClicked = createLastClickedState('old');

		handleSelectionClick(mockEvent({ metaKey: true }), { id: 'new' }, store, 'selectedTodos', lastClicked);

		expect(lastClicked.lastClickedId).toBe('new');
	});
});

// ── handleSelectionClick: shift+click (range select) ──

describe('handleSelectionClick — shift+click (range select)', () => {
	it('selects a forward range between lastClickedId and current todo', () => {
		const todos = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
		const store = createStore(todos);
		const lastClicked = createLastClickedState('b');

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 'd' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('b')).toBe(true);
		expect(store.selectedTodos.has('c')).toBe(true);
		expect(store.selectedTodos.has('d')).toBe(true);
		expect(store.selectedTodos.size).toBe(3);
	});

	it('selects a backward range (current < lastClickedId)', () => {
		const todos = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
		const store = createStore(todos);
		const lastClicked = createLastClickedState('d');

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 'b' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('b')).toBe(true);
		expect(store.selectedTodos.has('c')).toBe(true);
		expect(store.selectedTodos.has('d')).toBe(true);
		expect(store.selectedTodos.size).toBe(3);
	});

	it('selects a single item when lastClickedId equals current id', () => {
		const todos = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
		const store = createStore(todos);
		const lastClicked = createLastClickedState('y');

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 'y' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('y')).toBe(true);
		expect(store.selectedTodos.size).toBe(1);
	});

	it('works when lastClickedId is the first item and current is the last', () => {
		const todos = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
		const store = createStore(todos);
		const lastClicked = createLastClickedState('1');

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: '4' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.size).toBe(4);
		for (const t of todos) {
			expect(store.selectedTodos.has(t.id)).toBe(true);
		}
	});

	it('adds range items to existing selection (does not clear)', () => {
		const todos = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
		const store = createStore(todos);
		store.selectedTodos = new SvelteSet(['a', 'e']);
		const lastClicked = createLastClickedState('c');

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 'e' }, store, 'selectedTodos', lastClicked);

		// Should still have 'a' from before, and c,d,e from range
		expect(store.selectedTodos.has('a')).toBe(true);
		expect(store.selectedTodos.has('c')).toBe(true);
		expect(store.selectedTodos.has('d')).toBe(true);
		expect(store.selectedTodos.has('e')).toBe(true);
	});

	it('does nothing when lastClickedId is not found in allTodos', () => {
		const todos = [{ id: 'x' }, { id: 'y' }];
		const store = createStore(todos);
		store.selectedTodos = new SvelteSet(['x']);
		// lastClickedId references a todo not in the current list
		const lastClicked = createLastClickedState('nonexistent');

		// Shift-click enters the range branch but both findIndex calls must succeed
		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 'y' }, store, 'selectedTodos', lastClicked);

		// Nothing happens — the inner if condition (lastIdx !== -1 && currentIdx !== -1) is false
		expect(store.selectedTodos.has('x')).toBe(true);
		expect(store.selectedTodos.has('y')).toBe(false);
		expect(store.selectedTodos.size).toBe(1);
	});
});

// ── handleSelectionClick: regular click (single select) ──

describe('handleSelectionClick — regular click (single select)', () => {
	it('selects only the clicked todo, deselecting all others', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1', '2', '3']);

		const lastClicked = createLastClickedState('2');

		handleSelectionClick(mockEvent(), { id: '4' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('4')).toBe(true);
		expect(store.selectedTodos.has('1')).toBe(false);
		expect(store.selectedTodos.has('2')).toBe(false);
		expect(store.selectedTodos.has('3')).toBe(false);
		expect(store.selectedTodos.size).toBe(1);
	});

	it('updates lastClickedId to the clicked todo id', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1']);

		const lastClicked = createLastClickedState('1');

		handleSelectionClick(mockEvent(), { id: 'new-id' }, store, 'selectedTodos', lastClicked);

		expect(lastClicked.lastClickedId).toBe('new-id');
	});

	it('selects a single todo when selection set is empty', () => {
		const store = createStore();
		const lastClicked = createLastClickedState();

		handleSelectionClick(mockEvent(), { id: 'only' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('only')).toBe(true);
		expect(store.selectedTodos.size).toBe(1);
	});
});

// ── handleSelectionClick: shift+click with no lastClickedId ──

describe('handleSelectionClick — shift+click with no lastClickedId', () => {
	it('falls through to single select when lastClickedId is null', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1', '2']);

		const lastClicked = createLastClickedState(null);

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: '3' }, store, 'selectedTodos', lastClicked);

		// Should behave as regular click — single select
		expect(store.selectedTodos.has('3')).toBe(true);
		expect(store.selectedTodos.has('1')).toBe(false);
		expect(store.selectedTodos.has('2')).toBe(false);
		expect(store.selectedTodos.size).toBe(1);
	});

	it('updates lastClickedId when falling through to single select', () => {
		const store = createStore();
		const lastClicked = createLastClickedState(null);

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 'new-id' }, store, 'selectedTodos', lastClicked);

		expect(lastClicked.lastClickedId).toBe('new-id');
	});
});

// ── handleSelectionClick: with selectedArchived key ──

describe('handleSelectionClick — with selectedArchived key', () => {
	it('works with archived selection using store.archivedTodos', () => {
		const archivedTodos = [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }, { id: 'a4' }];
		const store = createStore([], archivedTodos);
		const lastClicked = createLastClickedState('a2');

		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 'a4' }, store, 'selectedArchived', lastClicked);

		expect(store.selectedArchived.has('a2')).toBe(true);
		expect(store.selectedArchived.has('a3')).toBe(true);
		expect(store.selectedArchived.has('a4')).toBe(true);
		expect(store.selectedArchived.size).toBe(3);
	});

	it('toggles archived items with meta+click', () => {
		const archivedTodos = [{ id: 'a1' }, { id: 'a2' }];
		const store = createStore([], archivedTodos);
		store.selectedArchived = new SvelteSet(['a1']);

		const lastClicked = createLastClickedState('a1');

		handleSelectionClick(mockEvent({ metaKey: true }), { id: 'a2' }, store, 'selectedArchived', lastClicked);

		expect(store.selectedArchived.has('a1')).toBe(true);
		expect(store.selectedArchived.has('a2')).toBe(true);
		expect(store.selectedArchived.size).toBe(2);
	});

	it('single-clicks archived item correctly', () => {
		const archivedTodos = [{ id: 'a1' }, { id: 'a2' }];
		const store = createStore([], archivedTodos);
		store.selectedArchived = new SvelteSet(['a1']);

		const lastClicked = createLastClickedState('a1');

		handleSelectionClick(mockEvent(), { id: 'a2' }, store, 'selectedArchived', lastClicked);

		expect(store.selectedArchived.has('a2')).toBe(true);
		expect(store.selectedArchived.has('a1')).toBe(false);
		expect(store.selectedArchived.size).toBe(1);
	});

	it('uses selectedTodos key with store.todos (not store.archivedTodos)', () => {
		const todos = [{ id: 't1' }, { id: 't2' }];
		const archivedTodos = [{ id: 'a1' }];
		const store = createStore(todos, archivedTodos);
		const lastClicked = createLastClickedState('t1');

		// Shift+click on t2 — range t1->t2 in todos
		handleSelectionClick(mockEvent({ shiftKey: true }), { id: 't2' }, store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.has('t1')).toBe(true);
		expect(store.selectedTodos.has('t2')).toBe(true);
		expect(store.selectedTodos.size).toBe(2);
		// Archived set should not be affected
		expect(store.selectedArchived.size).toBe(0);
	});
});

// ── clearSelection ──

describe('clearSelection()', () => {
	it('empties the selection set', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1', '2', '3']);

		const lastClicked = createLastClickedState('1');

		clearSelection(store, 'selectedTodos', lastClicked);

		expect(store.selectedTodos.size).toBe(0);
	});

	it('resets lastClickedId to null', () => {
		const store = createStore();
		const lastClicked = createLastClickedState('some-id');

		clearSelection(store, 'selectedTodos', lastClicked);

		expect(lastClicked.lastClickedId).toBeNull();
	});

	it('works with selectedArchived key', () => {
		const store = createStore();
		store.selectedArchived = new SvelteSet(['a1', 'a2']);

		const lastClicked = createLastClickedState('a1');

		clearSelection(store, 'selectedArchived', lastClicked);

		expect(store.selectedArchived.size).toBe(0);
		expect(lastClicked.lastClickedId).toBeNull();
	});

	it('sets the selection to a new SvelteSet instance (triggers reactivity)', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1']);

		const originalSet = store.selectedTodos;
		clearSelection(store, 'selectedTodos', { lastClickedId: '1' });

		// Should be a different instance (new SvelteSet triggers Svelte reactivity)
		expect(store.selectedTodos).not.toBe(originalSet);
	});

	it('handles absence of lastClickedState gracefully', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1']);

		// Calling clearSelection without lastClickedState should not throw
		expect(() => clearSelection(store, 'selectedTodos', undefined)).not.toThrow();

		expect(store.selectedTodos.size).toBe(0);
	});

	it('handles null lastClickedState gracefully', () => {
		const store = createStore();
		store.selectedTodos = new SvelteSet(['1']);

		expect(() => clearSelection(store, 'selectedTodos', null)).not.toThrow();

		expect(store.selectedTodos.size).toBe(0);
	});
});
