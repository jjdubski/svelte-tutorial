import { createContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { storageGet, storageSet } from '$lib/storage.js';

/**
 * @typedef {Object} Todo
 * @property {number} id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [dueDate]
 * @property {string} [priority]
 * @property {string} [category]
 * @property {string[]} [tags]
 * @property {string} [recurring]
 * @property {Array<{text:string, done:boolean}>} [subtasks]
 * @property {boolean} completed
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Stats
 * @property {number} active
 * @property {number} completed
 * @property {number} overdue
 * @property {number} total
 */

class TodoStore {
	/** @type {number} */
	nextId = $state(1);
	/** @type {boolean} */
	isLoading = $state(true);
	/** @type {boolean} */
	prefersReducedMotion = $state(false);

	// ── Todos ──
	/** @type {Todo[]} */
	todos = $state([]);

	// ── Categories ──
	/** @type {string[]} */
	categories = $state(['Work', 'Personal', 'Ideas']);
	/** @type {Record<string,string>} */
	categoryColors = $state({
		Work: '#3b82f6',
		Personal: '#22c55e',
		Ideas: '#a855f7'
	});

	// ── Tags ──
	/** @type {string[]} */
	availableTags = $state(['urgent', 'meeting', 'home', 'shopping', 'health']);
	/** @type {Record<string,string>} */
	tagColors = $state({
		urgent: '#ef4444',
		meeting: '#f59e0b',
		home: '#06b6d4',
		shopping: '#ec4899',
		health: '#22c55e'
	});

	// ── Templates ──
	templates = $state([
		{
			name: 'None',
			title: '',
			description: '',
			dueDate: '',
			priority: 'medium',
			category: '',
			tags: []
		},
		{
			name: 'Meeting',
			title: 'Meeting with ',
			description: 'Discuss ',
			dueDate: '',
			priority: 'medium',
			category: 'Work',
			tags: ['meeting']
		},
		{
			name: 'Errand',
			title: '',
			description: 'Buy ',
			dueDate: '',
			priority: 'low',
			category: 'Personal',
			tags: ['shopping']
		},
		{
			name: 'Urgent',
			title: 'URGENT: ',
			description: '',
			dueDate: '',
			priority: 'high',
			category: 'Work',
			tags: ['urgent']
		},
		{
			name: 'Health',
			title: 'Workout: ',
			description: '',
			dueDate: '',
			priority: 'medium',
			category: 'Personal',
			tags: ['health']
		}
	]);

	// ── Form state ──
	newTitle = $state('');
	newDescription = $state('');
	newDueDate = $state('');
	newPriority = $state('medium');
	newCategory = $state('');
	newTags = $state([]);
	newCustomTag = $state('');
	newRecurring = $state('');
	newCategoryName = $state('');
	showAddCategory = $state(false);
	showForm = $state(true);
	selectedTemplate = $state('None');

	// ── Filter / Sort ──
	filterText = $state('');
	filterStatus = $state('all');
	filterCategory = $state('');
	sortBy = $state('manual');

	// ── Select mode ──
	selectMode = $state(false);
	selectedTodos = $state(new SvelteSet());

	// ── Toast ──
	toast = $state({ show: false, message: '', type: 'success' });
	/** @type {Todo|null} */
	lastDeletedTodo = $state(null);

	// ── Dark mode ──
	darkMode = $state(false);

	// ── Drag and drop ──
	/** @type {number|null} */
	draggedId = $state(null);
	/** @type {number|null} */
	dragOverId = $state(null);

	// ── Derived values (updated by $effect) ──
	/** @type {Stats} */
	stats = $state({ active: 0, completed: 0, overdue: 0, total: 0 });
	/** @type {Todo[]} */
	filteredTodos = $state([]);

	/** @type {boolean} */
	storageError = $state(false);

	constructor() {
		this._init();
		this._checkReducedMotion();

		// Effect: recompute stats + save todos whenever todos changes
		$effect(() => {
			const t = this.todos;
			this.stats = this._computeStats(t);
			this.filteredTodos = this._computeFiltered(t);
			storageSet('todos', t);
		});

		// Effect: recompute filteredTodos when filters/sort change
		$effect(() => {
			// Read filter/sort deps to track them
			const ft = this.filterText;
			const fs = this.filterStatus;
			const fc = this.filterCategory;
			const sb = this.sortBy;
			// Recompute filtered from current todos + these filters
			this.filteredTodos = this._computeFiltered(this.todos, ft, fs, fc, sb);
		});

		// Effect: sync dark mode to DOM and localStorage
		$effect(() => {
			const dm = this.darkMode;
			if (typeof document !== 'undefined') {
				document.documentElement.classList.toggle('dark', dm);
				document.documentElement.style.colorScheme = dm ? 'dark' : 'light';
			}
			storageSet('darkMode', dm);
		});

		// Effect: template detection — unset template if user modified fields
		$effect(() => {
			if (this.selectedTemplate !== 'None') {
				const t = this.templates.find((t) => t.name === this.selectedTemplate);
				if (t) {
					const hasChanges =
						this.newTitle !== t.title ||
						this.newDescription !== t.description ||
						this.newDueDate !== t.dueDate ||
						this.newPriority !== t.priority ||
						this.newCategory !== t.category ||
						JSON.stringify(this.newTags) !== JSON.stringify(t.tags) ||
						this.newRecurring !== '';
					if (hasChanges) {
						this.selectedTemplate = 'None';
					}
				}
			}
		});
	}

	// ── Initialization ──

	_init() {
		const saved = storageGet('todos');
		if (saved && Array.isArray(saved) && saved.length > 0) {
			this.todos = saved;
			this.nextId = Math.max(...saved.map((t) => t.id)) + 1;
		}
		this.darkMode = this._getInitialDarkMode();
		this.isLoading = false;
	}

	_checkReducedMotion() {
		if (typeof window !== 'undefined') {
			this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		}
	}

	_getInitialDarkMode() {
		const saved = storageGet('darkMode');
		if (saved !== null) return saved;
		if (typeof window !== 'undefined') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		return false;
	}

	// ── Stats computation ──

	/**
	 * @param {Todo[]} todos
	 * @returns {Stats}
	 */
	_computeStats(todos) {
		const today = new Date().toISOString().split('T')[0];
		const active = todos.filter((t) => !t.completed).length;
		const completed = todos.filter((t) => t.completed).length;
		const overdue = todos.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length;
		return { active, completed, overdue, total: todos.length };
	}

	/**
	 * @param {Todo[]} todos
	 * @param {string} [filterText]
	 * @param {string} [filterStatus]
	 * @param {string} [filterCategory]
	 * @param {string} [sortBy]
	 * @returns {Todo[]}
	 */
	_computeFiltered(todos, filterText, filterStatus, filterCategory, sortBy) {
		// Use instance values if not explicitly passed
		const ft = filterText ?? this.filterText;
		const fs = filterStatus ?? this.filterStatus;
		const fc = filterCategory ?? this.filterCategory;
		const sb = sortBy ?? this.sortBy;

		let result = todos;
		if (ft.trim()) {
			const q = ft.toLowerCase();
			result = result.filter(
				(t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
			);
		}
		if (fs === 'active') {
			result = result.filter((t) => !t.completed);
		} else if (fs === 'done') {
			result = result.filter((t) => t.completed);
		}
		if (fc) {
			result = result.filter((t) => t.category === fc);
		}
		if (sb === 'priority') {
			const order = { high: 0, medium: 1, low: 2 };
			result = [...result].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
		} else if (sb === 'date') {
			result = [...result].sort((a, b) => {
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate) - new Date(b.dueDate);
			});
		}
		return result;
	}

	// ── Todo CRUD ──

	/**
	 * @param {string} title
	 * @param {string} description
	 * @param {string} dueDate
	 * @param {string} priority
	 * @param {string} category
	 * @param {string[]} tags
	 * @param {string} recurring
	 * @param {Array<{text:string, done:boolean}>} [subtasks]
	 */
	addTodo(title, description, dueDate, priority, category, tags, recurring, subtasks) {
		this.todos.push({
			id: this.nextId++,
			title,
			description,
			dueDate,
			priority,
			category,
			tags: tags || [],
			recurring,
			subtasks: subtasks?.filter((s) => s.text.trim()) || [],
			completed: false,
			createdAt: new Date().toISOString()
		});
	}

	/**
	 * Add a task from form state. Subtasks are passed in from form component (not stored).
	 * @param {Array<{text:string, done:boolean}>} [subtasks]
	 */
	addFromForm(subtasks) {
		if (this.newTitle.trim()) {
			this.addTodo(
				this.newTitle.trim(),
				this.newDescription.trim(),
				this.newDueDate,
				this.newPriority,
				this.newCategory,
				this.newTags,
				this.newRecurring,
				subtasks
			);
			this.resetForm();
		}
	}

	resetForm() {
		this.newTitle = '';
		this.newDescription = '';
		this.newDueDate = '';
		this.newPriority = 'medium';
		this.newCategory = '';
		this.newTags = [];
		this.newRecurring = '';
		this.selectedTemplate = 'None';
	}

	applyTemplate(template) {
		this.selectedTemplate = template.name;
		this.newTitle = template.title;
		this.newDescription = template.description;
		this.newDueDate = template.dueDate;
		this.newPriority = template.priority;
		this.newCategory = template.category;
		this.newTags = [...template.tags];
		this.newRecurring = '';
	}

	/**
	 * @param {number} id
	 * @param {Partial<Todo>} updates
	 */
	updateTodo(id, updates) {
		const todo = this.todos.find((t) => t.id === id);
		if (todo) {
			Object.assign(todo, updates);
		}
	}

	/**
	 * @param {number} id
	 */
	deleteTodo(id) {
		const index = this.todos.findIndex((t) => t.id === id);
		if (index !== -1) {
			const { id: _id, ...rest } = this.todos[index];
			this.lastDeletedTodo = { todo: { ...rest, id: _id }, index };
			this.todos = this.todos.filter((t) => t.id !== id);
			this.showToast('Task deleted', 'info');
		}
	}

	undoDelete() {
		if (this.lastDeletedTodo) {
			this.todos.splice(this.lastDeletedTodo.index, 0, this.lastDeletedTodo.todo);
			this.todos = [...this.todos];
			this.lastDeletedTodo = null;
			this.showToast('Task restored', 'success');
		}
	}

	/**
	 * @param {number} id
	 */
	toggleTodo(id) {
		const todo = this.todos.find((t) => t.id === id);
		if (todo) {
			const wasCompleted = todo.completed;
			todo.completed = !todo.completed;
			// Recurring task: create new instance with updated due date
			if (!wasCompleted && todo.completed && todo.recurring) {
				const newDueDate = this.getNextDueDate(todo.dueDate, todo.recurring);
				this.addTodo(
					todo.title,
					todo.description || '',
					newDueDate,
					todo.priority,
					todo.category || '',
					todo.tags || [],
					todo.recurring,
					todo.subtasks || []
				);
			}
		}
	}

	// ── Batch operations ──

	/**
	 * @param {number} id
	 */
	toggleSelect(id) {
		if (this.selectedTodos.has(id)) {
			this.selectedTodos.delete(id);
		} else {
			this.selectedTodos.add(id);
		}
	}

	selectAll() {
		this.selectedTodos = new SvelteSet(this.filteredTodos.map((t) => t.id));
	}

	deselectAll() {
		this.selectedTodos = new SvelteSet();
	}

	deleteSelected() {
		const count = this.selectedTodos.size;
		this.todos = this.todos.filter((t) => !this.selectedTodos.has(t.id));
		this.showToast(`${count} tasks deleted`, 'info');
		this.selectedTodos = new SvelteSet();
		this.selectMode = false;
	}

	completeSelected() {
		const count = this.selectedTodos.size;
		this.todos = this.todos.map((t) =>
			this.selectedTodos.has(t.id) ? { ...t, completed: true } : t
		);
		this.showToast(`${count} tasks completed`, 'success');
		this.selectedTodos = new SvelteSet();
		this.selectMode = false;
	}

	// ── Category management ──

	/**
	 * @param {string} cat
	 */
	setFilterCategory(cat) {
		if (cat) {
			this.filterCategory = this.filterCategory === cat ? '' : cat;
		} else {
			this.filterCategory = '';
		}
	}

	addCategory() {
		const name = this.newCategoryName.trim();
		if (name && !this.categories.includes(name)) {
			this.categories = [...this.categories, name];
			const colors = [
				'#ef4444',
				'#f59e0b',
				'#06b6d4',
				'#ec4899',
				'#84cc16',
				'#14b8a6',
				'#f97316',
				'#8b5cf6'
			];
			const used = Object.values(this.categoryColors);
			const avail = colors.find((c) => !used.includes(c));
			this.categoryColors = { ...this.categoryColors, [name]: avail || '#64748b' };
			this.newCategoryName = '';
			this.showAddCategory = false;
		}
	}

	// ── Tag management ──

	addCustomTag() {
		const tag = this.newCustomTag.trim().toLowerCase();
		if (tag && !this.newTags.includes(tag)) {
			this.newTags = [...this.newTags, tag];
			if (!this.availableTags.includes(tag)) {
				this.availableTags = [...this.availableTags, tag];
				this.tagColors = { ...this.tagColors, [tag]: this._getRandomTagColor() };
			}
		}
		this.newCustomTag = '';
	}

	_getRandomTagColor() {
		const colors = [
			'#ef4444',
			'#f59e0b',
			'#06b6d4',
			'#ec4899',
			'#84cc16',
			'#14b8a6',
			'#f97316',
			'#8b5cf6',
			'#6366f1'
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	// ── Drag and drop ──

	/**
	 * @param {DragEvent} e
	 * @param {number} id
	 */
	handleDragStart(e, id) {
		this.draggedId = id;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', String(id));
	}

	handleDragEnd() {
		this.draggedId = null;
		this.dragOverId = null;
	}

	/**
	 * @param {DragEvent} e
	 * @param {number} id
	 */
	handleDragOver(e, id) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if (this.draggedId !== id) {
			this.dragOverId = id;
		}
	}

	handleDragLeave() {
		this.dragOverId = null;
	}

	/**
	 * @param {DragEvent} e
	 * @param {number} id
	 */
	handleDrop(e, targetId) {
		e.preventDefault();
		this.dragOverId = null;
		if (this.draggedId === null || this.draggedId === targetId) return;
		const fromIdx = this.todos.findIndex((t) => t.id === this.draggedId);
		const toIdx = this.todos.findIndex((t) => t.id === targetId);
		if (fromIdx === -1 || toIdx === -1) return;
		const item = this.todos.splice(fromIdx, 1)[0];
		this.todos.splice(toIdx, 0, item);
		this.draggedId = null;
	}

	// ── Recurrence ──

	/**
	 * @param {string} currentDate
	 * @param {string} recurring
	 * @returns {string}
	 */
	getNextDueDate(currentDate, recurring) {
		if (!currentDate || !recurring) return '';
		const date = new Date(currentDate + 'T00:00:00');
		switch (recurring) {
			case 'daily':
				date.setDate(date.getDate() + 1);
				break;
			case 'weekly':
				date.setDate(date.getDate() + 7);
				break;
			case 'monthly':
				date.setMonth(date.getMonth() + 1);
				break;
		}
		return date.toISOString().split('T')[0];
	}

	// ── Toast ──

	/**
	 * @param {string} message
	 * @param {'success'|'info'|'warning'} type
	 */
	showToast(message, type = 'info') {
		this.toast = { show: true, message, type };
		const duration = type === 'info' ? (message.includes('deleted') ? 4000 : 3000) : 2000;
		setTimeout(() => {
			this.toast = { ...this.toast, show: false };
		}, duration);
	}

	// ── Keyboard shortcut ──

	/**
	 * @param {KeyboardEvent} e
	 */
	handleKeydown(e) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
			e.preventDefault();
			this.showForm = true;
			setTimeout(() => document.getElementById('title-input')?.focus(), 50);
		}
		if (e.key === 'Escape') {
			if (this.selectMode) {
				this.selectMode = false;
				this.selectedTodos = new SvelteSet();
			}
		}
	}
}

// ── Context (type-safe via createContext) ──

/** @typedef {InstanceType<typeof TodoStore>} TodoStoreType */

export const [getTodoStore, setTodoStore] = createContext /** @type {TodoStoreType} */();

/**
 * Factory function to create a new TodoStore instance and set it in context.
 * @returns {TodoStoreType}
 */
export function createTodoStore() {
	const store = new TodoStore();
	setTodoStore(store);
	return store;
}
