<script>
	import { getTodoStore } from '$lib/state/todoStore.svelte.js';

	const store = getTodoStore();

	let activeDisplayed = $state(0);
	let completedDisplayed = $state(0);
	let overdueDisplayed = $state(0);

	const springOpts = { stiffness: 0.15, damping: 0.85 };
	let rafId;
	let initialized = false;
	const animatedRefs = {
		active: {
			get value() {
				return activeDisplayed;
			},
			set value(v) {
				activeDisplayed = v;
			},
			velocity: 0
		},
		completed: {
			get value() {
				return completedDisplayed;
			},
			set value(v) {
				completedDisplayed = v;
			},
			velocity: 0
		},
		overdue: {
			get value() {
				return overdueDisplayed;
			},
			set value(v) {
				overdueDisplayed = v;
			},
			velocity: 0
		}
	};

	function clearAnimation() {
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = undefined;
		}
	}

	function animatedValue(target, ref, opts = springOpts) {
		const delta = target - ref.value;
		ref.velocity = (ref.velocity + delta * opts.stiffness) * opts.damping;
		const next = ref.value + ref.velocity;

		if (Math.abs(target - next) < 0.01 && Math.abs(ref.velocity) < 0.01) {
			ref.value = target;
			ref.velocity = 0;
			return false;
		}

		ref.value = next;
		return true;
	}

	$effect(() => {
		const targets = {
			active: store.stats.active,
			completed: store.stats.completed,
			overdue: store.stats.overdue
		};

		clearAnimation();

		if (!initialized || store.prefersReducedMotion) {
			animatedRefs.active.value = targets.active;
			animatedRefs.completed.value = targets.completed;
			animatedRefs.overdue.value = targets.overdue;
			animatedRefs.active.velocity = 0;
			animatedRefs.completed.velocity = 0;
			animatedRefs.overdue.velocity = 0;
			initialized = true;
			return;
		}

		const animateFrame = () => {
			const activeMoving = animatedValue(targets.active, animatedRefs.active, springOpts);
			const completedMoving = animatedValue(targets.completed, animatedRefs.completed, springOpts);
			const overdueMoving = animatedValue(targets.overdue, animatedRefs.overdue, springOpts);

			if (activeMoving || completedMoving || overdueMoving) {
				rafId = requestAnimationFrame(animateFrame);
			} else {
				rafId = undefined;
			}
		};

		rafId = requestAnimationFrame(animateFrame);

		return () => {
			clearAnimation();
		};
	});
</script>

<div
	class="mb-6 flex gap-0 overflow-hidden rounded-xl border p-0"
	style="background: var(--todo-bg); border-color: var(--border);"
>
	<div class="flex flex-1 flex-col items-center p-4">
		<span
			class="text-xl font-bold sm:text-2xl"
			style="color: var(--text-heading); line-height: 1; font-variant-numeric: tabular-nums;"
			>{store.prefersReducedMotion ? store.stats.active : Math.round(activeDisplayed)}</span
		>
		<span class="mt-1 text-sm sm:text-base" style="color: var(--text-muted);">Active</span>
	</div>
	<div class="w-px self-stretch" style="background: var(--border);"></div>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-xl font-bold sm:text-2xl" style="color: var(--text-heading); line-height: 1;"
			>{store.prefersReducedMotion ? store.stats.completed : Math.round(completedDisplayed)}</span
		>
		<span class="mt-1 text-sm sm:text-base" style="color: var(--text-muted);">Completed</span>
	</div>
	<div class="w-px self-stretch" style="background: var(--border);"></div>
	<div class="flex flex-1 flex-col items-center p-4">
		<span class="text-xl font-bold sm:text-2xl" style="color: var(--priority-high); line-height: 1;"
			>{store.prefersReducedMotion ? store.stats.overdue : Math.round(overdueDisplayed)}</span
		>
		<span class="mt-1 text-sm sm:text-base" style="color: var(--text-muted);">Overdue</span>
	</div>
</div>
