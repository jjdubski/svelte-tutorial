<script>
	import { spring } from 'svelte/motion';

	let { stats, prefersReducedMotion = false } = $props();

	let activeSpring = spring(0, { stiffness: 0.15, damping: 0.85 });
	let completedSpring = spring(0, { stiffness: 0.15, damping: 0.85 });
	let overdueSpring = spring(0, { stiffness: 0.15, damping: 0.85 });

	$effect(() => {
		if (!prefersReducedMotion) {
			activeSpring.set(stats.active);
		}
	});
	$effect(() => {
		if (!prefersReducedMotion) {
			completedSpring.set(stats.completed);
		}
	});
	$effect(() => {
		if (!prefersReducedMotion) {
			overdueSpring.set(stats.overdue);
		}
	});
</script>

<div
	class="mb-6 flex gap-0 overflow-hidden rounded-xl border p-0"
	style="background: var(--todo-bg); border-color: var(--border);"
>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-2xl font-bold" style="color: var(--text-heading); line-height: 1;"
			>{prefersReducedMotion ? stats.active : Math.round($activeSpring)}</span
		>
		<span class="mt-1 text-sm" style="color: var(--text-muted);">Active</span>
	</div>
	<div class="w-px self-stretch" style="background: var(--border);"></div>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-2xl font-bold" style="color: var(--text-heading); line-height: 1;"
			>{prefersReducedMotion ? stats.completed : Math.round($completedSpring)}</span
		>
		<span class="mt-1 text-sm" style="color: var(--text-muted);">Completed</span>
	</div>
	<div class="w-px self-stretch" style="background: var(--border);"></div>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-2xl font-bold" style="color: var(--priority-high); line-height: 1;"
			>{prefersReducedMotion ? stats.overdue : Math.round($overdueSpring)}</span
		>
		<span class="mt-1 text-sm" style="color: var(--text-muted);">Overdue</span>
	</div>
</div>
