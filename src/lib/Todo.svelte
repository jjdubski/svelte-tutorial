<script>
	let {
		todo,
		updateTodo,
		deleteTodo,
		toggleTodo,
		categories,
		categoryColors,
		sortBy,
		handleDragStart,
		handleDragEnd,
		handleDragOver,
		handleDragLeave,
		handleDrop
	} = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let editDueDate = $state('');
	let editPriority = $state('');
	let editCategory = $state('');

	function formatDate(dateStr) {
		if (!dateStr) return '';
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function startEdit() {
		editing = true;
		editTitle = todo.title;
		editDescription = todo.description;
		editDueDate = todo.dueDate;
		editPriority = todo.priority || 'medium';
		editCategory = todo.category || '';
	}

	function save() {
		updateTodo(todo.id, editTitle, editDescription, editDueDate, editPriority, editCategory);
		editing = false;
	}

	function cancel() {
		editing = false;
	}

	function handleEditKeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			cancel();
		}
	}
</script>

{#if editing}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<form class="todo-edit" onkeydown={handleEditKeydown}>
		<input bind:value={editTitle} placeholder="Title" />
		<textarea bind:value={editDescription} placeholder="Description"></textarea>
		<div class="form-inline">
			<input type="date" bind:value={editDueDate} />
			<select bind:value={editPriority}>
				<option value="high">High</option>
				<option value="medium">Medium</option>
				<option value="low">Low</option>
			</select>
			<select bind:value={editCategory}>
				<option value="">No category</option>
				{#each categories as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
		</div>
		<div class="todo-edit-actions">
			<button type="button" onclick={cancel} class="btn btn-cancel">Cancel</button>
			<button type="button" onclick={save} class="btn btn-save">Save</button>
		</div>
	</form>
{:else}
	<div
		role="listitem"
		class="todo-card"
		class:completed={todo.completed}
		draggable={sortBy === 'manual'}
		ondragstart={(e) => handleDragStart(e, todo.id)}
		ondragend={handleDragEnd}
		ondragover={(e) => handleDragOver(e, todo.id)}
		ondragleave={handleDragLeave}
		ondrop={(e) => handleDrop(e, todo.id)}
	>
		{#if sortBy === 'manual'}
			<div class="drag-handle" aria-label="Drag to reorder">
				<span></span><span></span><span></span>
			</div>
		{/if}

		<div class="todo-body">
			<div class="todo-header">
				<input
					type="checkbox"
					class="todo-check"
					checked={todo.completed}
					onchange={() => toggleTodo(todo.id)}
				/>
				<h3 class="todo-title">{todo.title}</h3>
				<span class="priority-badge priority-{todo.priority || 'medium'}">
					{todo.priority || 'medium'}
				</span>
				{#if todo.category && categories.includes(todo.category)}
					<span class="category-badge" style="background: {categoryColors[todo.category]}; color: #fff;">
						{todo.category}
					</span>
				{/if}
			</div>
			{#if todo.description}
				<p class="todo-desc">{todo.description}</p>
			{/if}
			<div class="todo-meta">
				{#if todo.dueDate}
					<p class="todo-due">Due: {formatDate(todo.dueDate)}</p>
				{/if}
			</div>
		</div>

		<div class="todo-actions">
			<button onclick={startEdit} class="btn btn-edit">Edit</button>
			<button onclick={() => deleteTodo(todo.id)} class="btn btn-delete">Delete</button>
		</div>
	</div>
{/if}
