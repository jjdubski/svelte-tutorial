<script>
	import { Sun, Moon } from 'lucide-svelte';
	import { getTodoStore } from '$lib/todoStore.svelte.js';

	const store = getTodoStore();
</script>

<div class="relative mb-6 flex items-center justify-center">
	<h1
		class="m-0 text-4xl font-light"
		style="color: var(--text-heading); font-family: 'Caveat', 'Brush Script MT', cursive; letter-spacing: 0.02em;"
	>
		Todo List
	</h1>
	<button
		class="glow-btn absolute right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border"
		style="background: var(--todo-bg); border-color: var(--border); color: var(--text-secondary);"
		data-btn="ghost"
		onclick={() => (store.darkMode = !store.darkMode)}
		aria-label={store.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
	>
		{#if store.darkMode}
			<Sun size={20} />
		{:else}
			<Moon size={20} />
		{/if}
	</button>
</div>

<!-- Shortcut hint moved here from footer -->
<div class="mb-4 text-center text-xs" style="color: var(--text-muted);">
	<kbd
		class="inline-block rounded px-1.5 py-0.5 text-[11px]"
		style="background: var(--todo-bg); border: 1px solid var(--border); font-family: inherit; margin: 0 2px;"
		>Ctrl</kbd
	>+<kbd
		class="inline-block rounded px-1.5 py-0.5 text-[11px]"
		style="background: var(--todo-bg); border: 1px solid var(--border); font-family: inherit; margin: 0 2px;"
		>N</kbd
	>
	quick add
</div>
