import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SvelteSet } from 'svelte/reactivity';
import { TodoStore } from '../todoStore.svelte.js';

// Extract pure computation methods from the TodoStore prototype.
// These methods don't use `this` or runes — they operate purely on arguments.
const {
	_fuzzyMatch,
	_computeStats,
	_computeStreak,
	_computeCompletionsByDay,
	_computePriorityDistribution,
	_computeCategoryBreakdown,
	_computeOverdueTasks,
	_computeUpcomingDue,
	_getRandomTagColor,
	getNextDueDate
} = TodoStore.prototype;

describe('TodoStore pure methods', () => {
	describe('_fuzzyMatch', () => {
		it('returns true when query is empty', () => {
			expect(_fuzzyMatch('', 'anything')).toBe(true);
			expect(_fuzzyMatch('', '')).toBe(true);
		});

		it('returns true when all query chars appear in order in text', () => {
			expect(_fuzzyMatch('groc', 'Buy groceries')).toBe(true);
		});

		it('is case-insensitive', () => {
			expect(_fuzzyMatch('GROC', 'buy groceries')).toBe(true);
			expect(_fuzzyMatch('groc', 'BUY GROCERIES')).toBe(true);
		});

		it('returns false when query does not match', () => {
			expect(_fuzzyMatch('xyz', 'hello world')).toBe(false);
		});

		it('requires characters in order', () => {
			expect(_fuzzyMatch('ba', 'ab')).toBe(false);
		});

		it('works with single character', () => {
			expect(_fuzzyMatch('a', 'hello world')).toBe(false);
			expect(_fuzzyMatch('h', 'hello world')).toBe(true);
		});

		it('matches with gaps', () => {
			expect(_fuzzyMatch('hw', 'hello world')).toBe(true);
		});
	});

	describe('_computeStats', () => {
		it('returns zero counts for empty todos', () => {
			const stats = _computeStats([]);
			expect(stats).toEqual({ active: 0, completed: 0, overdue: 0, total: 0 });
		});

		it('counts active tasks', () => {
			const todos = [
				{ id: 1, completed: false },
				{ id: 2, completed: false },
				{ id: 3, completed: true }
			];
			const stats = _computeStats(todos);
			expect(stats.active).toBe(2);
			expect(stats.completed).toBe(1);
			expect(stats.total).toBe(3);
		});

		it('counts overdue tasks (past due date and not completed)', () => {
			const todos = [
				{ id: 1, completed: false, dueDate: '2020-01-01' }, // overdue
				{ id: 2, completed: false, dueDate: '2099-12-31' }, // future, not overdue
				{ id: 3, completed: true, dueDate: '2020-01-01' }, // completed, not overdue
				{ id: 4, completed: false } // no due date, not overdue
			];
			const stats = _computeStats(todos);
			expect(stats.overdue).toBe(1);
			expect(stats.active).toBe(3);
			expect(stats.completed).toBe(1);
			expect(stats.total).toBe(4);
		});

		it('all completed tasks', () => {
			const todos = [
				{ id: 1, completed: true },
				{ id: 2, completed: true }
			];
			const stats = _computeStats(todos);
			expect(stats.active).toBe(0);
			expect(stats.completed).toBe(2);
			expect(stats.overdue).toBe(0);
			expect(stats.total).toBe(2);
		});
	});

	describe('_getRandomTagColor', () => {
		it('returns a hex color string', () => {
			const color = _getRandomTagColor();
			expect(color).toMatch(/^#[0-9a-f]{6}$/);
		});

		it('returns one of the predefined colors when Math.random is controlled', () => {
			vi.spyOn(Math, 'random').mockReturnValue(0);
			const color = _getRandomTagColor();
			// Math.random() returns 0 → index 0 → '#ef4444'
			expect(color).toBe('#ef4444');
			vi.restoreAllMocks();
		});

		it('returns last color when Math.random is near 1', () => {
			vi.spyOn(Math, 'random').mockReturnValue(0.999);
			const color = _getRandomTagColor();
			// Math.floor(0.999 * 9) = 8 → index 8 → '#6366f1'
			expect(color).toBe('#6366f1');
			vi.restoreAllMocks();
		});

		it('returns different colors on different random values', () => {
			const colors = new Set();
			// Call multiple times with controlled randomness to verify variety
			for (let i = 0; i < 20; i++) {
				vi.spyOn(Math, 'random').mockReturnValue(i / 20);
				colors.add(_getRandomTagColor());
				vi.restoreAllMocks();
			}
			// With 20 calls across the range, we should see at least a few different colors
			expect(colors.size).toBeGreaterThan(1);
		});
	});

	describe('getNextDueDate', () => {
		it('returns empty string when no currentDate or recurring', () => {
			expect(getNextDueDate('', 'daily')).toBe('');
			expect(getNextDueDate('2024-01-01', '')).toBe('');
			expect(getNextDueDate('', '')).toBe('');
		});

		it('adds 1 day for daily recurrence', () => {
			expect(getNextDueDate('2024-01-01', 'daily')).toBe('2024-01-02');
			expect(getNextDueDate('2024-12-31', 'daily')).toBe('2025-01-01'); // year boundary
		});

		it('adds 7 days for weekly recurrence', () => {
			expect(getNextDueDate('2024-01-01', 'weekly')).toBe('2024-01-08');
			expect(getNextDueDate('2024-12-25', 'weekly')).toBe('2025-01-01'); // year boundary
		});

		it('adds 1 month for monthly recurrence', () => {
			expect(getNextDueDate('2024-01-15', 'monthly')).toBe('2024-02-15');
			expect(getNextDueDate('2024-12-01', 'monthly')).toBe('2025-01-01'); // year boundary
		});

		it('handles month-end overflow correctly (JS behavior)', () => {
			// Jan 31 + 1 month → JavaScript date.setMonth overflows to Mar 2
			// This is correct JS Date behavior (not a bug)
			const result = getNextDueDate('2024-01-31', 'monthly');
			expect(result).toBe('2024-03-02');
		});
	});

	describe('_computeStreak', () => {
		it('returns 0 when no completed tasks', () => {
			expect(_computeStreak([])).toBe(0);
		});

		it('returns 0 when completed tasks have no completedAt', () => {
			const todos = [{ id: 1, completed: true }];
			expect(_computeStreak(todos)).toBe(0);
		});

		it('counts a single completion today as streak of 1', () => {
			const now = new Date();
			const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			const todos = [{ id: 1, completed: true, completedAt: today + 'T12:00:00' }];
			expect(_computeStreak(todos)).toBe(1);
		});

		it('counts consecutive days backwards from today', () => {
			const todos = [];
			for (let i = 0; i < 3; i++) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
				todos.push({ id: i + 1, completed: true, completedAt: dateStr + 'T12:00:00' });
			}
			expect(_computeStreak(todos)).toBe(3);
		});

		it('breaks streak when a day is missing', () => {
			const todos = [];
			// Today and yesterday completed, but day before yesterday is missing
			for (let i = 0; i < 2; i++) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
				todos.push({ id: i + 1, completed: true, completedAt: dateStr + 'T12:00:00' });
			}
			// Add a completion from 3 days ago (gap at 2 days ago)
			const d3 = new Date();
			d3.setDate(d3.getDate() - 3);
			const dateStr3 = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`;
			todos.push({
				id: 3,
				completed: true,
				completedAt: dateStr3 + 'T12:00:00'
			});
			expect(_computeStreak(todos)).toBe(2);
		});
	});

	describe('_computeCompletionsByDay', () => {
		it('returns zero counts for no completions', () => {
			const result = _computeCompletionsByDay([]);
			expect(result).toEqual({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
		});

		it('counts a completion on its correct day of week', () => {
			// Create a completion for today (using local date)
			const now = new Date();
			const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			const dayOfWeek = now.getDay();
			const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			const todos = [{ id: 1, completed: true, completedAt: todayStr + 'T12:00:00' }];
			const result = _computeCompletionsByDay(todos);
			expect(result[labels[dayOfWeek]]).toBe(1);
		});
	});

	describe('_computePriorityDistribution', () => {
		it('returns zero counts for empty todos', () => {
			expect(_computePriorityDistribution([])).toEqual({ high: 0, medium: 0, low: 0 });
		});

		it('counts tasks by priority', () => {
			const todos = [
				{ id: 1, priority: 'high' },
				{ id: 2, priority: 'high' },
				{ id: 3, priority: 'medium' },
				{ id: 4, priority: 'low' }
			];
			const result = _computePriorityDistribution(todos);
			expect(result).toEqual({ high: 2, medium: 1, low: 1 });
		});

		it('defaults missing priority to medium', () => {
			const todos = [{ id: 1 }, { id: 2, priority: 'high' }];
			const result = _computePriorityDistribution(todos);
			expect(result).toEqual({ high: 1, medium: 1, low: 0 });
		});
	});

	describe('_computeCategoryBreakdown', () => {
		it('returns empty object for no categories', () => {
			expect(_computeCategoryBreakdown([])).toEqual({});
		});

		it('counts tasks by category', () => {
			const todos = [
				{ id: 1, category: 'Work' },
				{ id: 2, category: 'Work' },
				{ id: 3, category: 'Personal' }
			];
			const result = _computeCategoryBreakdown(todos);
			expect(result).toEqual({ Work: 2, Personal: 1 });
		});

		it('ignores tasks without a category', () => {
			const todos = [{ id: 1 }, { id: 2, category: 'Work' }];
			const result = _computeCategoryBreakdown(todos);
			expect(result).toEqual({ Work: 1 });
		});
	});

	describe('_computeOverdueTasks', () => {
		it('returns empty array when no todos', () => {
			expect(_computeOverdueTasks([])).toEqual([]);
		});

		it('returns tasks that are past due and not completed', () => {
			const todos = [
				{ id: 1, completed: false, dueDate: '2020-01-01' }, // overdue
				{ id: 2, completed: false, dueDate: '2099-12-31' }, // future
				{ id: 3, completed: true, dueDate: '2020-01-01' }, // completed, not overdue
				{ id: 4, completed: false } // no due date
			];
			const result = _computeOverdueTasks(todos);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(1);
		});
	});

	describe('_computeUpcomingDue', () => {
		it('returns empty array when no todos', () => {
			expect(_computeUpcomingDue([])).toEqual([]);
		});

		it('returns tasks due today or within next 2 days (in local time)', () => {
			// Use local date strings so the test is timezone-independent
			const now = new Date();
			const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			const tomorrowLocal = new Date(now);
			tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
			const tomorrowStr = `${tomorrowLocal.getFullYear()}-${String(tomorrowLocal.getMonth() + 1).padStart(2, '0')}-${String(tomorrowLocal.getDate()).padStart(2, '0')}`;
			const twoDaysLocal = new Date(now);
			twoDaysLocal.setDate(twoDaysLocal.getDate() + 2);
			const twoDaysStr = `${twoDaysLocal.getFullYear()}-${String(twoDaysLocal.getMonth() + 1).padStart(2, '0')}-${String(twoDaysLocal.getDate()).padStart(2, '0')}`;

			const todos = [
				{ id: 1, completed: false, dueDate: todayLocal }, // due today
				{ id: 2, completed: false, dueDate: tomorrowStr }, // due tomorrow
				{ id: 3, completed: false, dueDate: twoDaysStr }, // due in 2 days
				{ id: 4, completed: false, dueDate: '2099-12-31' }, // far future, excluded
				{ id: 5, completed: true, dueDate: todayLocal }, // completed, excluded
				{ id: 6, completed: false } // no due date, excluded
			];
			const result = _computeUpcomingDue(todos);
			expect(result).toHaveLength(3);
			expect(result.map((t) => t.id)).toEqual([1, 2, 3]);
		});

		it('sorts results by due date ascending', () => {
			const now = new Date();
			const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			const tomorrowLocal = new Date(now);
			tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
			const tomorrowStr = `${tomorrowLocal.getFullYear()}-${String(tomorrowLocal.getMonth() + 1).padStart(2, '0')}-${String(tomorrowLocal.getDate()).padStart(2, '0')}`;

			const todos = [
				{ id: 1, completed: false, dueDate: tomorrowStr },
				{ id: 2, completed: false, dueDate: todayLocal }
			];
			const result = _computeUpcomingDue(todos);
			expect(result[0].id).toBe(2);
			expect(result[1].id).toBe(1);
		});
	});

	describe('completeSelected with recurring tasks', () => {
		/** @type {import('../todoStore.svelte.js').default} */
		let store;

		beforeEach(() => {
			// Mock localStorage so store constructor doesn't fail
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
			store = new TodoStore();
			// Silence showToast (which uses setTimeout)
			store.showToast = vi.fn();
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('creates a new recurring instance when completing a selected recurring task', () => {
			store.todos = [
				{
					id: 1,
					title: 'Daily standup',
					completed: false,
					dueDate: '2026-05-09',
					recurring: 'daily',
					tags: [],
					createdAt: '2026-05-09T00:00:00.000Z'
				}
			];
			store.nextId = 2;
			store.selectedTodos = new SvelteSet([1]);
			store.selectMode = true;

			store.completeSelected();

			// Original task should be completed
			expect(store.todos[0].completed).toBe(true);
			expect(store.todos[0].completedAt).toBeTruthy();
			// New recurring copy should exist
			expect(store.todos.length).toBe(2);
			expect(store.todos[1].recurring).toBe('daily');
			expect(store.todos[1].completed).toBe(false);
			expect(store.todos[1].dueDate).toBe('2026-05-10');
			expect(store.todos[1].title).toBe('Daily standup');
			// Select mode cleared
			expect(store.selectMode).toBe(false);
			expect(store.selectedTodos.size).toBe(0);
		});

		it('creates recurring copies for multiple selected recurring tasks', () => {
			store.todos = [
				{
					id: 1,
					title: 'Daily A',
					completed: false,
					dueDate: '2026-05-09',
					recurring: 'daily',
					tags: [],
					createdAt: '2026-05-09T00:00:00.000Z'
				},
				{
					id: 2,
					title: 'Weekly B',
					completed: false,
					dueDate: '2026-05-09',
					recurring: 'weekly',
					tags: [],
					createdAt: '2026-05-09T00:00:00.000Z'
				},
				{
					id: 3,
					title: 'One-time C',
					completed: false,
					dueDate: '2026-05-09',
					tags: [],
					createdAt: '2026-05-09T00:00:00.000Z'
				}
			];
			store.nextId = 10;
			store.selectedTodos = new SvelteSet([1, 2, 3]);

			store.completeSelected();

			// Should have 5 todos: 3 completed originals + 2 recurring copies (one-time doesn't recur)
			expect(store.todos.length).toBe(5);
			expect(store.todos[0].completed).toBe(true); // Daily A
			expect(store.todos[1].completed).toBe(true); // Weekly B
			expect(store.todos[2].completed).toBe(true); // One-time C
			// Recurring copies
			const copies = store.todos.filter((t) => !t.completed);
			expect(copies).toHaveLength(2);
			expect(copies.find((t) => t.recurring === 'daily')).toBeTruthy();
			expect(copies.find((t) => t.recurring === 'weekly')).toBeTruthy();
		});

		it('does not create copies for non-recurring tasks', () => {
			store.todos = [
				{
					id: 1,
					title: 'One-time task',
					completed: false,
					dueDate: '2026-05-09',
					tags: [],
					createdAt: '2026-05-09T00:00:00.000Z'
				}
			];
			store.nextId = 2;
			store.selectedTodos = new SvelteSet([1]);

			store.completeSelected();

			expect(store.todos.length).toBe(1);
			expect(store.todos[0].completed).toBe(true);
		});

		it('does not create a recurring copy if the todo is already completed', () => {
			store.todos = [
				{
					id: 1,
					title: 'Already done recurring',
					completed: true,
					dueDate: '2026-05-09',
					recurring: 'daily',
					tags: [],
					createdAt: '2026-05-09T00:00:00.000Z',
					completedAt: '2026-05-09T12:00:00.000Z'
				}
			];
			store.nextId = 2;
			store.selectedTodos = new SvelteSet([1]);

			store.completeSelected();

			// Should still be just 1 todo — no recurring copy spawned
			expect(store.todos.length).toBe(1);
			expect(store.todos[0].completed).toBe(true);
			expect(store.todos[0].recurring).toBe('daily');
		});
	});
});
