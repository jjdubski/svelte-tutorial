<script>
	// Skeleton loading animation with pulse effect
</script>

<div class="flex flex-col gap-2.5">
	{#each { length: 3 } as _, i (i)}
		<div class="rounded-xl p-3" style="background: var(--todo-bg); border: 1px solid var(--border); animation: pulse 1.5s ease-in-out infinite; animation-delay: {i * 150}ms;">
			<div class="flex items-center gap-2 mb-2">
				<div class="w-[18px] h-[18px] rounded" style="background: var(--border);"></div>
				<div class="flex-1 max-w-[60%] h-4 rounded" style="background: linear-gradient(90deg, var(--border) 25%, var(--input-bg) 50%, var(--border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div>
				<div class="w-[50px] h-[18px] rounded-full" style="background: var(--border);"></div>
			</div>
			<div class="h-3 w-[80%] mb-2 rounded" style="background: linear-gradient(90deg, var(--border) 25%, var(--input-bg) 50%, var(--border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; animation-delay: 0.1s;"></div>
			<div class="h-2.5 w-[40%] rounded" style="background: linear-gradient(90deg, var(--border) 25%, var(--input-bg) 50%, var(--border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; animation-delay: 0.2s;"></div>
		</div>
	{/each}
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>
