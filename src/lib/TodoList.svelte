<script>
	import { fade, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { elasticOut, cubicOut } from 'svelte/easing';
	import { Layers, Plus } from 'lucide-svelte';
	import Todo from '$lib/Todo.svelte';
	import SkeletonLoader from '$lib/SkeletonLoader.svelte';
	import { getTodoStore } from '$lib/todoStore.svelte.js';

	const store = getTodoStore();
</script>

<div class="flex flex-col gap-2">
	{#if store.isLoading}
		<SkeletonLoader />
	{:else if store.filteredTodos.length === 0}
		<div
			class="flex flex-col items-center px-4 py-12"
			in:fade={{ duration: store.prefersReducedMotion ? 0 : 300 }}
		>
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
				style="background: linear-gradient(135deg, var(--btn-primary) 0%, var(--btn-edit) 100%); color: white;"
			>
				<Layers size={40} />
			</div>
			<h3 class="m-0 mb-2 text-lg font-semibold" style="color: var(--text-heading);">
				{store.todos.length === 0 ? 'No tasks yet' : 'No results'}
			</h3>
			<p class="m-0 mb-6 text-sm" style="color: var(--text-muted);">
				{store.todos.length === 0 ? 'Add a task to get started' : 'No tasks match your filters'}
			</p>
			{#if store.todos.length === 0}
				<button
					class="glow-btn flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none px-4 py-3.5 text-base font-semibold"
					style="background: var(--btn-primary); color: white; max-width: 280px;"
					data-btn="primary"
					onclick={() => (store.showForm = true)}
				>
					<Plus size={16} /> Add your first task
				</button>
			{/if}
		</div>
	{:else}
		{#each store.filteredTodos as todo, i (todo.id)}
			<div
				animate:flip={{ duration: store.prefersReducedMotion ? 0 : 300, easing: cubicOut }}
				in:scale={{
					duration: store.prefersReducedMotion ? 0 : 220,
					easing: elasticOut,
					delay: store.prefersReducedMotion ? 0 : i * 40
				}}
				out:fade={{ duration: store.prefersReducedMotion ? 0 : 150 }}
			>
				<Todo {todo} />
			</div>
		{/each}
	{/if}
</div>
