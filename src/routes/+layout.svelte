<script lang="ts">
	let { children } = $props()
</script>

<div id="lchok">
	<div id="header">
		<p id="title">LCH, OK?</p>
		<p id="subtitle">A Color Game</p>
	</div>

	<div id="content">{@render children()}</div>
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
	:global(html) {
		height: 100%;
	}
	:global(body) {
		font-family: 'Figtree', system-ui, sans-serif;
		margin: 0;
		height: 100%;
		display: flex;
		justify-content: center;
	}

	#lchok {
		display: grid;
		width: min(100% - 2rem, 600px);
		height: 100%;
		overflow: hidden;
		grid-template-rows: repeat(4, 1fr);
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

	#content {
		grid-row: 2 / -1;
	}
</style>
