<script>
	import StatsBar from '$lib/components/StatsBar.svelte';

	let { children } = $props();
</script>

<div
	class="flex min-h-dvh justify-center p-4"
	style="background: linear-gradient(145deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%); transition: background 0.3s;"
>
	<div
		class="w-full max-w-[1080px] rounded-2xl border p-8 sm:rounded-xl sm:p-5 xl:max-w-[1400px] 2xl:max-w-[1600px]"
		style="background: var(--card-bg); box-shadow: 0 8px 32px var(--shadow); border-color: var(--border); transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;"
	>
		<StatsBar />
		{@render children()}
	</div>
</div>
