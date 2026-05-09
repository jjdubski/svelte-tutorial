<script>
	import { slide } from 'svelte/transition';
	import { Search, CheckSquare, Trash2, X } from 'lucide-svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { getTodoStore } from '$lib/todoStore.svelte.js';

	const store = getTodoStore();
</script>

<!-- Filter Bar -->
<div class="mb-3 flex flex-wrap gap-2">
	<div
		class="flex min-w-[160px] flex-1 items-center gap-2 rounded-xl border px-3 py-2.5"
		style="background: var(--input-bg); border-color: var(--border);"
	>
		<Search size={16} style="color: var(--text-muted);" />
		<input
			class="m-0 flex-1 border-none bg-transparent p-0 text-sm outline-none"
			style="color: var(--text);"
			bind:value={store.filterText}
			placeholder="Search..."
		/>
	</div>
	<select
		class="rounded-xl p-2.5 px-3 text-sm"
		style="border: 1px solid var(--border); background: var(--input-bg); color: var(--text); cursor: pointer;"
		bind:value={store.filterStatus}
		aria-label="Filter by status"
	>
		<option value="all">All</option>
		<option value="active">Active</option>
		<option value="done">Done</option>
	</select>
	<select
		class="rounded-xl p-2.5 px-3 text-sm"
		style="border: 1px solid var(--border); background: var(--input-bg); color: var(--text); cursor: pointer;"
		bind:value={store.sortBy}
		aria-label="Sort by"
	>
		<option value="manual">Sort</option>
		<option value="priority">Priority</option>
		<option value="date">Date</option>
	</select>
	<div class="relative">
		<button
			class="glow-btn flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border"
			style="background: var(--input-bg); border-color: var(--border); color: var(--text-muted);"
			data-btn="ghost"
			class:active={store.selectMode}
			onclick={() => (store.selectMode = !store.selectMode)}
			aria-label="Toggle select mode"
		>
			{#if store.selectMode && store.selectedTodos.size > 0}
				<span class="text-sm font-semibold">{store.selectedTodos.size}</span>
			{:else}
				<CheckSquare size={18} />
			{/if}
		</button>
		{#if store.selectMode}
			<div
				class="absolute top-full right-0 z-50 mt-2 flex gap-1.5 rounded-xl border p-2 whitespace-nowrap shadow-lg"
				style="background: var(--card-bg); border-color: var(--border);"
				transition:slide={{ duration: store.prefersReducedMotion ? 0 : 150 }}
			>
				<button
					class="glow-btn flex cursor-pointer items-center gap-1 rounded-lg border-none px-2.5 py-2 text-xs font-medium"
					style="background: var(--btn-save); color: white;"
					data-btn="save"
					onclick={() => store.completeSelected()}
					disabled={store.selectedTodos.size === 0}
				>
					<CheckSquare size={14} /> Complete
				</button>
				<button
					class="glow-btn flex cursor-pointer items-center gap-1 rounded-lg border-none px-2.5 py-2 text-xs font-medium"
					style="background: var(--btn-delete); color: white;"
					data-btn="delete"
					onclick={() => store.deleteSelected()}
					disabled={store.selectedTodos.size === 0}
				>
					<Trash2 size={14} /> Delete
				</button>
				<button
					class="glow-btn flex cursor-pointer items-center gap-1 rounded-lg border-none px-2.5 py-2 text-xs font-medium"
					style="background: var(--btn-cancel); color: white;"
					data-btn="cancel"
					onclick={() => {
						store.selectMode = false;
						store.selectedTodos = new SvelteSet();
					}}
				>
					<X size={14} /> Cancel
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Categories -->
<div
	class="mb-3 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5"
	style="background: var(--todo-bg); border-color: var(--border); transition: background 0.3s, border-color 0.3s;"
>
	<button
		class="glow-btn cursor-pointer rounded-full border-transparent px-3 py-1.5 text-sm font-medium"
		style="color: var(--text-secondary);"
		data-btn="ghost"
		class:active={store.filterCategory === ''}
		onclick={() => (store.filterCategory = '')}>All</button
	>
	{#each store.categories as cat (cat)}
		<button
			class="glow-btn cursor-pointer rounded-full border-transparent px-3 py-1.5 text-sm font-medium"
			style="color: var(--text-secondary); --cat-color: {store.categoryColors[cat]};"
			data-btn="ghost"
			class:active={store.filterCategory === cat}
			onclick={() => store.setFilterCategory(cat)}
		>
			{cat}
		</button>
	{/each}
	{#if store.showAddCategory}
		<form
			class="flex items-center gap-1"
			onsubmit={(e) => {
				e.preventDefault();
				store.addCategory();
			}}
		>
			<input
				class="w-[70px] rounded-md px-2 py-1 text-xs"
				style="border: 1px solid var(--border); background: var(--input-bg); color: var(--text);"
				bind:value={store.newCategoryName}
				placeholder="New"
			/>
			<button
				type="submit"
				class="cursor-pointer rounded-md border-none px-2 py-1 text-xs font-medium"
				style="background: var(--btn-save); color: white;"
				data-btn="save">Add</button
			>
			<button
				type="button"
				class="cursor-pointer rounded-md border-none px-2 py-1 text-xs font-medium"
				style="background: var(--btn-cancel); color: white;"
				data-btn="cancel"
				onclick={() => (store.showAddCategory = false)}>X</button
			>
		</form>
	{:else}
		<button
			class="cursor-pointer rounded-full border border-dashed bg-none px-2 py-1 text-xs"
			style="border-color: var(--border-input); color: var(--text-muted); transition: all 0.15s;"
			data-btn="ghost"
			onclick={() => (store.showAddCategory = true)}>+</button
		>
	{/if}
</div>

<style>
	button.active {
		background: var(--btn-primary) !important;
		color: white !important;
	}

	button[data-btn='ghost'].active {
		background: var(--btn-primary) !important;
		color: white !important;
	}

	[data-btn='ghost']:hover {
		background: var(--todo-bg) !important;
		border-color: var(--text-muted) !important;
	}

	@media (prefers-reduced-motion: reduce) {
		* {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
		}
	}
</style>
