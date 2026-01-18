<script lang="ts">
	import { onMount } from 'svelte'
	let { children } = $props()
	import ThemeSelector from '../components/ThemeSelector.svelte'
	import { theme } from '../routes/state.svelte'
	import Button from '../components/Button.svelte'
	import Modal from '../components/Modal.svelte'

	let viewHowTo = $state(false)

	onMount(() => {
		theme.current = (localStorage.getItem('theme') || 'system') as 'light' | 'dark' | 'system'
	})
</script>

<div id="app-root" data-theme={theme.current}>
	<div id="lchok">
		<div id="header">
			<p id="title">LCH, OK?</p>
			<p id="subtitle">A Color Game</p>
		</div>
		<div id="options">
			<div class="grid-column-1">
				<ThemeSelector />
			</div>
			<Button onclick={() => (viewHowTo = true)} color="var(--foreground)" class="how-to"
				>HOW TO PLAY</Button
			>
		</div>
		<div id="content">{@render children()}</div>
		{#if viewHowTo}
			<Modal>
				<h3>HOW TO PLAY</h3>
				<p>
					LCH, OK? is a game that asks you to guess a color in the best color space, OKLCH. To do
					this, you must enter the values for Luminance (L), Chroma (C), and Hue (H).
				</p>
				<p>
					<b>Luminance</b> ranges from 0 to 1 and represents the brightness of the color.
				</p>
				<p><b>Chroma</b> ranges from 0 to 0.4 and represents the saturation of the color.</p>
				<p>
					<b>Hue</b> ranges from 0 to 340 and represents the hue of the color. For reference, this is
					where hue starts and ends:
				</p>
				<div id="hue-reference"></div>
				<p>
					Once you submit each guess, the game will tell you if the values are too low, too high, or
					spot on.
				</p>

				<p>Good luck!</p>
				<Button onclick={() => (viewHowTo = false)} color="var(--foreground)">GOT IT</Button>
			</Modal>
		{/if}
	</div>
</div>

<svelte:head>
	<title>LCH, OK?</title>
	<meta
		name="description"
		content="LCH, OK? - A daily color guessing game where you guess colors in the OKLCH color space by entering Luminance, Chroma, and Hue values."
	/>
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
		--disabled: #c0c0c0;
		--accent-luminance: 0.7;
		--exponential: cubic-bezier(0.16, 1, 0.3, 1);
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--background: #000;
			--foreground: #fff;
			--disabled: #5a5a5a;
			--accent-luminance: 0.5;
		}
	}

	[data-theme='light'] {
		--background: #fff;
		--foreground: #000;
		--disabled: #c0c0c0;
		--accent-luminance: 0.7;
	}

	[data-theme='dark'] {
		--background: #000;
		--foreground: #fff;
		--disabled: #5a5a5a;
		--accent-luminance: 0.5;
	}

	:global(html) {
		height: 100%;
	}
	:global(body) {
		font-family: 'Figtree', system-ui, sans-serif;
		margin: 0;
		height: 100%;
	}

	#app-root {
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
		width: min(calc(100% - 2rem), 600px);
		height: min(calc(100% - 1rem), 1000px);
		grid-template-rows: 1fr auto 850px;
		gap: 16px;
	}

	#lchok:has(#results) {
		overflow: hidden;
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
		gap: 16px;
	}

	#hue-reference {
		width: 100%;
		height: 50px;
		background-image: linear-gradient(
			to right in oklch increasing hue,
			oklch(0.7 0.3 0),
			oklch(0.7 0.3 340)
		);
	}

	p,
	h3 {
		margin: 0;
	}

	.grid-column-1 {
		grid-column: 1 / 2;
		height: fit-content;
	}

	:global(.how-to) {
		grid-column: 3 / 4;
	}

	@media (max-width: 600px) {
		#lchok {
			gap: 8px;
		}

		#header {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		#title {
			font-size: 2rem;
		}

		:global(.how-to) {
			grid-column: 2 / 4;
		}
	}

	@media (max-height: 1000px) {
		#lchok {
			grid-template-rows: 1fr auto calc(810px + 1rem);
		}
	}
</style>
