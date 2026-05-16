<script>
	import { tick } from 'svelte';

	let { title = '', description = '', priority = '', tags = [], tagColors = {}, targetEl = null } = $props();

	let bodyEl = $state(null);
	let isVisible = $state(false);
	let left = $state(0);
	let top = $state(0);
	let placement = $state('above');
	let positionReady = $state(false);

	let tooltipEl = $state(null);

	let showTimeout;
	let hideTimeout;

	function clearShowTimeout() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = undefined;
		}
	}

	function clearHideTimeout() {
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = undefined;
		}
	}

	function getPriorityColor(priorityValue) {
		if (priorityValue === 'high') return 'var(--priority-high)';
		if (priorityValue === 'low') return 'var(--priority-low)';
		return 'var(--priority-medium)';
	}

	function getTagColor(tag) {
		const color = tagColors?.[tag];
		return typeof color === 'string' && color.trim() ? color : '#64748b';
	}

	async function updatePosition() {
		if (!tooltipEl || !targetEl || !isVisible) return;

		const rect = targetEl.getBoundingClientRect();
		const tooltipRect = tooltipEl.getBoundingClientRect();
		const viewportPadding = 8;
		const offset = 8;

		let left = rect.left + rect.width / 2;
		const halfTooltipWidth = tooltipRect.width / 2;

		left = Math.max(
			viewportPadding + halfTooltipWidth,
			Math.min(left, window.innerWidth - viewportPadding - halfTooltipWidth)
		);

		let nextPlacement = 'above';
		let top = rect.top - offset;

		if (rect.top - offset - tooltipRect.height < viewportPadding) {
			nextPlacement = 'below';
			top = rect.bottom + offset;
		}

		if (nextPlacement === 'below' && top + tooltipRect.height > window.innerHeight - viewportPadding) {
			nextPlacement = 'above';
			top = Math.max(viewportPadding + tooltipRect.height, rect.top - offset);
		}

		placement = nextPlacement;
		positionReady = true;
		return { left, top };
	}

	async function showTooltip() {
		if (!targetEl) return;

		positionReady = false;
		isVisible = true;

		await tick();
		const pos = await updatePosition();
		if (pos) {
			left = pos.left;
			top = pos.top;
		}
	}

	function hideTooltip() {
		positionReady = false;
		isVisible = false;
	}

	function scheduleShow() {
		clearHideTimeout();
		clearShowTimeout();

		showTimeout = setTimeout(() => {
			void showTooltip();
		}, 200);
	}

	function scheduleHide() {
		clearShowTimeout();
		clearHideTimeout();

		hideTimeout = setTimeout(() => {
			hideTooltip();
		}, 100);
	}

	function handleTooltipMouseEnter() {
		clearHideTimeout();
	}

	function handleTooltipMouseLeave() {
		scheduleHide();
	}

	function handleViewportChange() {
		if (!isVisible) return;
		void updatePosition().then((pos) => {
			if (!pos) return;
			left = pos.left;
			top = pos.top;
		});
	}

	$effect(() => {
		if (targetEl) {
			scheduleShow();
		} else {
			scheduleHide();
		}

		return () => {
			clearShowTimeout();
			clearHideTimeout();
		};
	});

	$effect(() => {
		if (!isVisible || !tooltipEl) return;
		if (bodyEl && tooltipEl.parentNode !== bodyEl) {
			bodyEl.appendChild(tooltipEl);
		}

		title;
		description;
		priority;
		tags;
		tagColors;
		targetEl;

		void tick().then(() =>
			updatePosition().then((pos) => {
				if (!pos) return;
				left = pos.left;
				top = pos.top;
			})
		);
	});
</script>

<svelte:body bind:this={bodyEl} />
<svelte:window onresize={handleViewportChange} onscroll={handleViewportChange} />

{#if isVisible}
	<div
		bind:this={tooltipEl}
		class="tooltip-portal fixed z-[1000]"
		role="tooltip"
		style="left: {left}px; top: {top}px; transform: {placement === 'above'
			? 'translate(-50%, -100%)'
			: 'translate(-50%, 0)'}; visibility: {positionReady ? 'visible' : 'hidden'};"
		onmouseenter={handleTooltipMouseEnter}
		onmouseleave={handleTooltipMouseLeave}
	>
		<div
			class="relative w-max max-w-[220px] rounded-lg border px-2 py-1 text-xs shadow-lg"
			style="background: var(--card-bg); border-color: var(--border);"
		>
			<div class="flex items-center gap-1.5">
				<span class="font-semibold" style="color: var(--text-heading);">{title}</span>
				{#if priority}
					<span
						class="rounded px-1 text-[10px] font-bold text-white uppercase"
						style="background: {getPriorityColor(priority)}"
					>
						{priority}
					</span>
				{/if}
			</div>

			{#if description}
				<p class="m-0 mt-0.5" style="color: var(--text-secondary);">
					{description.length > 80 ? `${description.slice(0, 80)}...` : description}
				</p>
			{/if}

			{#if Array.isArray(tags) && tags.length > 0}
				<div class="mt-0.5 flex flex-wrap gap-1">
					{#each tags.slice(0, 3) as tag, i (`${tag}-${i}`)}
						<span class="rounded px-1 text-[10px] text-white" style="background: {getTagColor(tag)}"
							>{tag}</span
						>
					{/each}
				</div>
			{/if}

			<div
				class="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45"
				class:bottom-full={placement === 'below'}
				class:top-full={placement !== 'below'}
				style="background: var(--card-bg); border-color: var(--border); border-style: solid; border-width: {placement ===
				'below'
					? '1px 0 0 1px'
					: '0 1px 1px 0'};"
			></div>
		</div>
	</div>
{/if}
