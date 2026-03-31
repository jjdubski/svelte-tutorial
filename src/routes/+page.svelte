<script>
	import Todo from '../lib/Todo.svelte';

	let todos = $state([
		{ id: 1, title: 'Sample Todo', description: 'This is a sample todo item.' }
	]);

	let newTitle = $state('');
	let newDescription = $state('');

	function addTodo(title, description) {
		todos.push({ id: Date.now(), title, description });
	}

	function updateTodo(id, title, description) {
		const todo = todos.find(t => t.id === id);
		if (todo) {
			todo.title = title;
			todo.description = description;
		}
	}

	function deleteTodo(id) {
		todos = todos.filter(t => t.id !== id);
	}

	function add() {
		if (newTitle.trim()) {
			addTodo(newTitle, newDescription);
			newTitle = '';
			newDescription = '';
		}
	}
</script>

<div class="app-shell">
	<div class="app-card">
		<h1 class="app-title">Todo App</h1>

		<div class="form-row">
			<input bind:value={newTitle} placeholder="Todo title" />
			<textarea bind:value={newDescription} placeholder="Description"></textarea>
			<button onclick={add}>Add Todo</button>
		</div>

		<div>
			{#each todos as todo (todo.id)}
				<Todo {todo} {updateTodo} {deleteTodo} />
			{/each}
		</div>
	</div>
</div>
