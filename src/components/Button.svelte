<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements'

	type Props = HTMLButtonAttributes & {
		color?: string
	}

	let { color = 'black', children, ...props } = $props()
</script>

<button style="--color: {color}" {...props}>
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
		transition-property: opacity, height, padding, margin-bottom, outline-color;
		transition-duration: 300ms;
		transition-timing-function: var(--exponential);
		overflow: hidden;
	}

	button:disabled {
		opacity: 0;
		height: 0px;
		padding: 0px 12px;
		outline-color: transparent;
		cursor: default;
		transition-property: background-color, color, opacity, height, padding, margin-bottom,
			outline-color;
	}

	button:hover:enabled {
		background-color: var(--color);
		color: white;
	}
</style>
