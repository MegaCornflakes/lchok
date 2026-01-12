<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements'

	type Props = HTMLButtonAttributes & {
		color?: string
		animated?: boolean
	}

	let { color = 'black', animated = false, children, ...props } = $props()
</script>

<button style="--color: {color}" class:animated {...props}>
	{@render children()}
</button>

<style>
	button {
		height: 36px;
		padding: 4px 12px;
		font-family: unset;
		font-size: 16px;
		font-weight: bold;
		background-color: white;
		color: var(--color);
		border: none;
		outline: 4px solid var(--color);
		outline-offset: -4px;
		cursor: pointer;
		overflow: hidden;
	}

	button:hover:enabled {
		background-color: var(--color);
		color: white;
	}

	button.animated {
		animation: fadeAndGrow 300ms var(--exponential) 1;
	}

	@keyframes fadeAndGrow {
		0% {
			opacity: 0;
			height: 0px;
		}
		100% {
			opacity: 1;
			height: 36px;
		}
	}
</style>
