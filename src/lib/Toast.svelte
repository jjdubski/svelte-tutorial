<script>
	import { slide } from 'svelte/transition';
	import { RotateCcw, CheckCircle, Info, AlertTriangle } from 'lucide-svelte';

	let { message, type = 'info', undoDelete } = $props();
</script>

<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[min(90%,400px)]">
	<div
		class="flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-lg"
		style="background: var(--card-bg); border-color: var(--border); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);"
		class:success={type === 'success'}
		class:info={type === 'info'}
		class:warning={type === 'warning'}
		transition:slide={{ duration: 200 }}
	>
		<div class="shrink-0" class:text-green-500={type === 'success'} class:text-red-500={type === 'warning'} class:text-blue-500={type === 'info'}>
			{#if type === 'success'}
				<CheckCircle size={18} style="color: var(--btn-save);" />
			{:else if type === 'warning'}
				<AlertTriangle size={18} style="color: var(--priority-high);" />
			{:else}
				<Info size={18} style="color: var(--btn-primary);" />
			{/if}
		</div>
		<span class="flex-1 text-sm" style="color: var(--text);">{message}</span>
		{#if type === 'info' && undoDelete}
			<button
				class="flex items-center gap-1 px-2.5 py-1.5 border-none rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap"
				style="background: var(--btn-primary); color: white; transition: background 0.2s;"
				onclick={undoDelete}
				data-btn="primary"
			>
				<RotateCcw size={14} /> Undo
			</button>
		{/if}
	</div>
</div>

<style>
	.success {
		border-color: var(--btn-save) !important;
	}

	.info {
		border-color: var(--btn-primary) !important;
	}

	.warning {
		border-color: var(--priority-high) !important;
	}

	button:hover {
		filter: brightness(1.15);
	}
</style>
