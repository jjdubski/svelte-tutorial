<script>
	import { page } from '$app/stores';

	const links = [
		{ href: '/', label: 'Tasks' },
		{ href: '/board', label: 'Board' },
		{ href: '/stats', label: 'Analytics' },
		{ href: '/archived', label: 'Archived' }
	];
</script>

<nav
	class="flex items-center justify-center gap-1 border-b px-4 py-2"
	style="background: var(--card-bg); border-color: var(--border); transition: background 0.3s, border-color 0.3s;"
>
	<div class="flex gap-1">
		{#each links as link (link.href)}
			<a
				href={link.href}
				data-sveltekit-preload-data
				class="nav-link rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-all"
				class:active={$page.url.pathname === link.href}
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>

<style>
	.nav-link:hover {
		background: var(--input-bg);
		color: var(--text-heading);
	}

	.nav-link.active {
		background: var(--btn-primary);
		color: white;
	}
</style>
