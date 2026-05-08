<script>
	import Todo from '../lib/Todo.svelte';

	let nextId = $state(1);

	function loadTodos() {
		try {
			const saved = localStorage.getItem('todos');
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed.length > 0) {
					nextId = Math.max(...parsed.map(t => t.id)) + 1;
				}
				return parsed;
			}
		} catch {}
		return [];
	}

	function saveTodos(t) {
		try {
			localStorage.setItem('todos', JSON.stringify(t));
		} catch {}
	}

	let todos = $state(loadTodos());

	$effect(() => {
		saveTodos(todos);
	});

	let categories = $state(['Work', 'Personal', 'Ideas']);

	let categoryColors = $state({
		Work: '#3b82f6',
		Personal: '#22c55e',
		Ideas: '#a855f7'
	});

	let newTitle = $state('');
	let newDescription = $state('');
	let newDueDate = $state('');
	let newPriority = $state('medium');
	let newCategory = $state('');

	let filterText = $state('');
	let filterStatus = $state('all');
	let filterCategory = $state('');
	let sortBy = $state('manual');

	let newCategoryName = $state('');
	let showAddCategory = $state(false);

	function getInitialDarkMode() {
		try {
			const saved = localStorage.getItem('darkMode');
			if (saved !== null) return JSON.parse(saved);
		} catch {}
		if (typeof window !== 'undefined') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		return false;
	}

	let darkMode = $state(getInitialDarkMode());

	$effect(() => {
		document.documentElement.classList.toggle('dark', darkMode);
		try {
			localStorage.setItem('darkMode', JSON.stringify(darkMode));
		} catch {}
	});

	function addTodo(title, description, dueDate, priority, category) {
		todos.push({
			id: nextId++,
			title,
			description,
			dueDate,
			priority,
			category,
			completed: false
		});
	}

	function updateTodo(id, title, description, dueDate, priority, category) {
		const todo = todos.find(t => t.id === id);
		if (todo) {
			if (title !== undefined) todo.title = title;
			if (description !== undefined) todo.description = description;
			if (dueDate !== undefined) todo.dueDate = dueDate;
			if (priority !== undefined) todo.priority = priority;
			if (category !== undefined) todo.category = category;
		}
	}

	function deleteTodo(id) {
		todos = todos.filter(t => t.id !== id);
	}

	function toggleTodo(id) {
		const todo = todos.find(t => t.id === id);
		if (todo) todo.completed = !todo.completed;
	}

	function add() {
		if (newTitle.trim()) {
			addTodo(newTitle.trim(), newDescription.trim(), newDueDate, newPriority, newCategory);
			newTitle = '';
			newDescription = '';
			newDueDate = '';
			newPriority = 'medium';
			newCategory = '';
		}
	}

	function setFilterCategory(cat) {
		filterCategory = filterCategory === cat ? '' : cat;
	}

	function addCategory() {
		const name = newCategoryName.trim();
		if (name && !categories.includes(name)) {
			categories = [...categories, name];
			const colors = ['#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f97316', '#8b5cf6'];
			const used = Object.values(categoryColors);
			const avail = colors.find(c => !used.includes(c));
			categoryColors = { ...categoryColors, [name]: avail || '#64748b' };
			newCategoryName = '';
			showAddCategory = false;
		}
	}

	function removeCategory(name) {
		if (categories.length <= 1) return;
		categories = categories.filter(c => c !== name);
		const { [name]: _, ...rest } = categoryColors;
		categoryColors = rest;
		todos = todos.map(t => t.category === name ? { ...t, category: '' } : t);
		if (filterCategory === name) filterCategory = '';
	}

	let draggedId = $state(null);

	function handleDragStart(e, id) {
		draggedId = id;
		e.target.closest('.todo-card')?.classList.add('dragging');
		e.dataTransfer.effectAllowed = 'move';
	}

	function handleDragEnd(e) {
		e.target.closest('.todo-card')?.classList.remove('dragging');
		document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
		draggedId = null;
	}

	function handleDragOver(e, id) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		const el = e.currentTarget;
		if (draggedId !== id) {
			document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
			el.classList.add('drag-over');
		}
	}

	function handleDragLeave(e) {
		e.currentTarget.classList.remove('drag-over');
	}

	function handleDrop(e, targetId) {
		e.preventDefault();
		e.currentTarget.classList.remove('drag-over');
		if (draggedId === null || draggedId === targetId) return;
		const fromIdx = todos.findIndex(t => t.id === draggedId);
		const toIdx = todos.findIndex(t => t.id === targetId);
		if (fromIdx === -1 || toIdx === -1) return;
		const item = todos.splice(fromIdx, 1)[0];
		todos.splice(toIdx, 0, item);
		draggedId = null;
	}

	let filteredTodos = $derived.by(() => {
		let result = todos;
		if (filterText.trim()) {
			const q = filterText.toLowerCase();
			result = result.filter(t => t.title.toLowerCase().includes(q));
		}
		if (filterStatus === 'active') {
			result = result.filter(t => !t.completed);
		} else if (filterStatus === 'done') {
			result = result.filter(t => t.completed);
		}
		if (filterCategory) {
			result = result.filter(t => t.category === filterCategory);
		}
		if (sortBy === 'priority') {
			const order = { high: 0, medium: 1, low: 2 };
			result = [...result].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
		} else if (sortBy === 'date') {
			result = [...result].sort((a, b) => {
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate) - new Date(b.dueDate);
			});
		}
		return result;
	});
</script>

<div class="app-shell">
	<div class="app-card">
		<div class="header-row">
			<h1 class="app-title">Todo App</h1>
			<button class="dark-toggle" onclick={() => darkMode = !darkMode} aria-label="Toggle dark mode">
				{darkMode ? '☀️' : '🌙'}
			</button>
		</div>

		<div class="form-section">
			<input bind:value={newTitle} placeholder="Todo title" onkeydown={(e) => e.key === 'Enter' && add()} />
			<textarea bind:value={newDescription} placeholder="Description"></textarea>
			<div class="form-inline">
				<input type="date" bind:value={newDueDate} />
				<select bind:value={newPriority}>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
				<select bind:value={newCategory}>
					<option value="">No category</option>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>
			<button type="submit" onclick={add}>Add Todo</button>
		</div>

		<div class="filter-bar">
			<input bind:value={filterText} placeholder="Search todos..." />
			<select bind:value={filterStatus}>
				<option value="all">All</option>
				<option value="active">Active</option>
				<option value="done">Done</option>
			</select>
			<select bind:value={sortBy}>
				<option value="manual">Manual</option>
				<option value="priority">Priority</option>
				<option value="date">Due date</option>
			</select>
		</div>

		<div class="categories-bar">
			<button
				class="cat-btn"
				class:active={filterCategory === ''}
				onclick={() => filterCategory = ''}
			>All</button>
			{#each categories as cat}
				<button
					class="cat-btn"
					class:active={filterCategory === cat}
					onclick={() => setFilterCategory(cat)}
					style="--cat-filter-active: {categoryColors[cat]}; border-color: {filterCategory === cat ? categoryColors[cat] : undefined}; background: {filterCategory === cat ? categoryColors[cat] : undefined};"
				>
					{cat}
				</button>
			{/each}
			{#if showAddCategory}
				<form class="add-cat-form" onsubmit={(e) => { e.preventDefault(); addCategory(); }}>
					<input bind:value={newCategoryName} placeholder="New category" />
					<button type="submit" style="background: var(--btn-save);">Add</button>
					<button type="button" style="background: var(--btn-cancel);" onclick={() => showAddCategory = false}>X</button>
				</form>
			{:else}
				<button class="add-cat-btn" onclick={() => showAddCategory = true}>+ Category</button>
			{/if}
		</div>

		<div class="todo-list">
			{#if filteredTodos.length === 0}
				<p class="empty-state">No todos to show</p>
			{/if}
			{#each filteredTodos as todo (todo.id)}
				<Todo
					{todo}
					{updateTodo}
					{deleteTodo}
					{toggleTodo}
					{categories}
					{categoryColors}
					{sortBy}
					{handleDragStart}
					{handleDragEnd}
					{handleDragOver}
					{handleDragLeave}
					{handleDrop}
				/>
			{/each}
		</div>
	</div>
</div>
