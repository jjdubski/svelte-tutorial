<script>
	import { resolve } from '$app/paths';
	import { ArrowLeft } from 'lucide-svelte';

	let { href = '/tasks', label = 'Back to Tasks' } = $props();
</script>

<a
	href={resolve(href)}
	class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-all hover:opacity-80 sm:text-base"
	style="background: var(--btn-primary); color: white;"
>
	<ArrowLeft size={14} />
	{label}
</a>
