<script>
	let { todo, updateTodo, deleteTodo } = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');

	function save() {
		updateTodo(todo.id, editTitle, editDescription);
		editing = false;
	}

	function cancel() {
		editing = false;
	}
</script>

{#if editing}
	<div class="todo-edit">
		<input bind:value={editTitle} placeholder="Title" />
		<textarea bind:value={editDescription} placeholder="Description"></textarea>
		<div class="todo-actions">
			<button onclick={save} class="btn btn-save">Save</button>
			<button onclick={cancel} class="btn btn-cancel">Cancel</button>
		</div>
	</div>
{:else}
	<div class="todo-card">
		<h3 class="todo-title">{todo.title}</h3>
		<p class="todo-desc">{todo.description}</p>
		<div class="todo-actions">
			<button onclick={() => { editing = true; editTitle = todo.title; editDescription = todo.description; }} class="btn btn-edit">Edit</button>
			<button onclick={() => deleteTodo(todo.id)} class="btn btn-done">Done</button>
		</div>
	</div>
{/if}