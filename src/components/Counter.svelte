<script lang="ts">
	import { theme } from '../routes/state.svelte'

	// Props

	type Props = {
		accent: string
		value?: number
		stepSize?: number
		min?: number
		max?: number
		disabled?: boolean
		unused?: boolean
		correct?: boolean
		[key: string]: any
	}

	let {
		accent,
		value = $bindable(),
		stepSize = 1,
		min = -Infinity,
		max = Infinity,
		disabled = false,
		unused = false,
		correct = false,
		...props
	}: Props = $props()

	// Helper Functions

	/** Get the number of decimal places in a number */
	function getPrecision(num: number): number {
		const str = num.toString()
		const decimal = str.indexOf('.')
		return decimal === -1 ? 0 : str.length - decimal - 1
	}

	/** Round a number to a specified precision */
	function round(num: number, precision: number): number {
		const factor = 10 ** precision
		return Math.round(num * factor) / factor
	}

	/** Format a number to a string with a specified precision */
	function format(num: number | undefined, precision: number): string {
		if (num === undefined || num === null) return ''

		const str = num.toString()
		const padding = precision - getPrecision(num)

		if (padding <= 0) {
			return str
		}

		if (str.indexOf('.') === -1) {
			return str + '.' + '0'.repeat(padding)
		} else {
			return str + '0'.repeat(padding)
		}
	}

	const precision = $derived(getPrecision(stepSize))
	const displayValue = $derived(format(value, precision))

	// Event Handlers

	function increment() {
		if (value === undefined) {
			value = 0
		}
		value = Math.min(max, Math.max(min, round(value + stepSize, precision)))
	}

	function decrement() {
		if (value === undefined) {
			value = 0
		}
		value = Math.min(max, Math.max(min, round(value - stepSize, precision)))
	}

	// Press-and-hold repeat logic
	let repeatTimeout: ReturnType<typeof setTimeout> | null = null
	let repeatInterval: ReturnType<typeof setInterval> | null = null

	function startRepeat(action: () => void) {
		action() // Fire immediately on press
		repeatTimeout = setTimeout(() => {
			repeatInterval = setInterval(action, 80) // Repeat every 80ms after delay
		}, 400) // Initial delay before repeating
	}

	function stopRepeat() {
		if (repeatTimeout) {
			clearTimeout(repeatTimeout)
			repeatTimeout = null
		}
		if (repeatInterval) {
			clearInterval(repeatInterval)
			repeatInterval = null
		}
	}
</script>

<div
	class="counter"
	class:disabled
	class:unused
	class:correct
	{...props}
	style="--accent: {accent}"
>
	<div class="buttons">
		<button
			onmousedown={() => startRepeat(increment)}
			onmouseup={stopRepeat}
			onmouseleave={stopRepeat}
			class="increment"
			disabled={disabled || value === max}
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M4 16L12 8L20 16" stroke="black" stroke-width="4" />
			</svg>
		</button>
		<button
			onmousedown={() => startRepeat(decrement)}
			onmouseup={stopRepeat}
			onmouseleave={stopRepeat}
			class="decrement"
			disabled={disabled || value === min}
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M4 8L12 16L20 8" stroke-width="4" />
			</svg>
		</button>
	</div>
	<span class="value">{displayValue}</span>
</div>

<style>
	.counter {
		display: inline-flex;
		align-items: stretch;
		gap: 4px;
		flex: auto;
		border-color: var(--foreground);
		border-style: solid;
		border-width: 4px;
		background-color: var(--foreground);
		transition-property: gap, border-color, background-color;
		transition-duration: 400ms;
		transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
		--accent-adjusted: oklch(from var(--accent) var(--accent-luminance) c h);
	}

	.counter.disabled {
		gap: 0;
		pointer-events: none;
	}

	.counter.unused {
		border-color: var(--disabled);
		background-color: var(--disabled);
	}

	.counter.correct {
		border-color: var(--accent-adjusted);
		background-color: var(--accent-adjusted);
	}

	.counter.correct .value {
		color: var(--accent-adjusted);
	}

	.buttons {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 32px;
		transition: width 400ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.counter.disabled .buttons {
		width: 0;
	}

	.value {
		flex-grow: 1;
		text-align: center;
		align-content: center;
		background-color: var(--background);
		font-size: 2em;
		font-weight: bold;
		font-optical-sizing: auto;
		font-variant-numeric: tabular-nums;
		padding-inline: 16px;
	}

	button {
		cursor: pointer;
		border-radius: 0;
		border: none;
		padding: 4px;
		background-color: var(--background);
	}

	button:disabled {
		cursor: default;
	}

	button > svg > path {
		stroke: var(--foreground);
	}

	button:hover > svg > path {
		stroke: oklch(from var(--accent) var(--accent-luminance) c h);
	}

	button:disabled > svg > path {
		stroke: var(--disabled);
	}

	.counter.disabled button > svg > path {
		transition: stroke 400ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	button:focus {
		z-index: 1;
		outline: oklch(from var(--accent) var(--accent-luminance) c h) solid 4px;
	}

	svg {
		display: block;
		margin: auto;
	}

	@media (max-width: 600px) {
		.value {
			font-size: 1.5em;
			padding-inline: 8px;
		}

		.buttons {
			width: 24px;
		}

		button {
			padding: 2px;
		}

		svg {
			width: 20px;
			height: 20px;
		}
	}
</style>
