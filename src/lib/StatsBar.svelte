<script>
	let { stats } = $props();
</script>

<div
	class="mb-6 flex gap-0 overflow-hidden rounded-xl border p-0"
	style="background: var(--todo-bg); border-color: var(--border);"
>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-2xl font-bold" style="color: var(--text-heading); line-height: 1;"
			>{stats.active}</span
		>
		<span class="mt-1 text-sm" style="color: var(--text-muted);">Active</span>
	</div>
	<div class="w-px self-stretch" style="background: var(--border);"></div>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-2xl font-bold" style="color: var(--text-heading); line-height: 1;"
			>{stats.completed}</span
		>
		<span class="mt-1 text-sm" style="color: var(--text-muted);">Completed</span>
	</div>
	<div class="w-px self-stretch" style="background: var(--border);"></div>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-2xl font-bold" style="color: var(--priority-high); line-height: 1;"
			>{stats.overdue}</span
		>
		<span class="mt-1 text-sm" style="color: var(--text-muted);">Overdue</span>
	</div>
</div>
