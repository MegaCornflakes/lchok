<script lang="ts">
	import { onMount } from 'svelte'
	let { children } = $props()
	import ThemeSelector from '../components/ThemeSelector.svelte'
	import { theme } from '../routes/state.svelte'

	onMount(() => {
		theme.current = (localStorage.getItem('theme') || 'system') as 'light' | 'dark' | 'system'
	})
</script>

<div id="app" data-theme={theme.current}>
	<div id="lchok">
		<div id="header">
			<p id="title">LCH, OK?</p>
			<p id="subtitle">A Color Game</p>
		</div>
		<div id="options">
			<div class="grid-column-1">
				<ThemeSelector />
			</div>
		</div>
		<div id="content">{@render children()}</div>
	</div>
</div>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<style>
	:root {
		--background: #fff;
		--foreground: #000;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--background: #000;
			--foreground: #fff;
		}
	}

	[data-theme='light'] {
		--background: #fff;
		--foreground: #000;
	}

	[data-theme='dark'] {
		--background: #000;
		--foreground: #fff;
	}

	:global(html) {
		height: 100%;
	}
	:global(body) {
		font-family: 'Figtree', system-ui, sans-serif;
		margin: 0;
		height: 100%;
	}

	#app {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--background);
		color: var(--foreground);
	}

	#lchok {
		display: grid;
		width: min(100% - 2rem, 600px);
		height: 100%;
		overflow: hidden;
		grid-template-rows: 25% auto 1fr;
		gap: 16px;
	}

	#header {
		align-self: last baseline;
	}

	#title {
		font-size: 3rem;
		font-weight: bold;
		text-align: center;
		margin: 0;
	}

	#subtitle {
		font-size: 1.2rem;
		text-align: center;
		margin: 0;
	}

	#options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	.grid-column-1 {
		grid-column: 1 / 2;
	}
</style>
