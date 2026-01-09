<script lang="ts">
	import { onMount } from 'svelte'
	import Counter from '../components/Counter.svelte'

	type Vec3 = [number, number, number]

	const judgements = [
		{ below: '⬆️ Lighter', above: '⬇️ Darker' },
		{ below: '⬆️ More saturated', above: '⬇️ Less saturated' },
		{ below: '➡️ Further right', above: '⬅️ Further left' }
	]
	const stepSizes = [0.05, 0.02, 20]
	const limits = [
		{ min: 0, max: 1 },
		{ min: 0, max: 0.4 },
		{ min: 0, max: 360 }
	]

	let darkTheme = $state(false)
	let colorRGB = $state('150 150 150')
	let oklchValues: Vec3 = $state([0, 0, 0])
	let guesses: Array<Array<number | undefined>> = $state(
		Array.from({ length: 5 }, () => Array(3).fill(undefined))
	)
	let currentGuess = $state(0)
	let won = $state(false)

	function arraysEqual(a: Array<number | undefined>, b: Vec3): boolean {
		return a.length === b.length && a.every((val, i) => val === b[i])
	}

	function submit() {
		if (guesses[currentGuess].some((v) => v === undefined)) {
			return
		}

		if (arraysEqual(guesses[currentGuess], oklchValues)) {
			won = true
		}

		if (!won && currentGuess + 1 < guesses.length) {
			guesses[currentGuess].forEach((value, i) => {
				guesses[currentGuess + 1][i] = value
			})
		}

		currentGuess += 1
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			submit()
		}
	}

	function getDescriptor(index: number, value: number) {
		const { below, above } = judgements[index]
		const oklchValue = oklchValues[index]
		if (value < oklchValue) return below
		if (value > oklchValue) return above
		if (value === oklchValue) return 'Perfect'
	}

	// This section is written by Claude I'll blow up if something is wrong
	function linearSrgbToOklab(r: number, g: number, b: number): Vec3 {
		const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
		const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
		const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

		const l_ = Math.cbrt(l)
		const m_ = Math.cbrt(m)
		const s_ = Math.cbrt(s)

		return [
			0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
			1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
			0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
		]
	}

	function oklabToLinearSrgb(L: number, a: number, b: number): Vec3 {
		const l_ = L + 0.3963377774 * a + 0.2158037573 * b
		const m_ = L - 0.1055613458 * a - 0.0638541728 * b
		const s_ = L - 0.0894841775 * a - 1.291485548 * b

		const l = l_ ** 3
		const m = m_ ** 3
		const s = s_ ** 3

		return [
			+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
		]
	}

	function oklchToSrgb(L: number, C: number, h: number): Vec3 {
		const hRad = (h * Math.PI) / 180
		const a = C * Math.cos(hRad)
		const b = C * Math.sin(hRad)
		const rgbLinear = oklabToLinearSrgb(L, a, b)
		const rgbSrgb = rgbLinear.map((v) =>
			v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
		)
		return rgbSrgb.map((v) => Math.max(0, Math.min(255, v * 255))) as Vec3
	}

	function isValidSrgb(rgb: Vec3): boolean {
		return rgb.every((v) => v >= 0 && v <= 255)
	}

	function findMaxChroma(L: number, h: number, tolerance: number = 0.001): number {
		let low = 0
		let high = 0.4 // 0.4 is a reasonable upper bound for chroma in OKLCH
		while (high - low > tolerance) {
			const mid = (low + high) / 2
			const rgb = oklchToSrgb(L, mid, h)
			if (isValidSrgb(rgb)) {
				low = mid
			} else {
				high = mid
			}
		}
		return low
	}

	function roundTo(value: number, step: number): number {
		return Number((Math.round(value / step) * step).toFixed(10))
	}

	function generateRandomOklchColor(): Vec3 {
		const L = roundTo(Math.random(), 0.05)
		const h = roundTo(Math.random() * 360, 20)
		const maxChroma = findMaxChroma(L, h)
		const C = roundTo(Math.random() * maxChroma, 0.02)
		return [L, C, h]
	}
	// End Claude

	onMount(() => {
		oklchValues = generateRandomOklchColor()
		const [r, g, b] = oklchToSrgb(...oklchValues)
		colorRGB = `${r} ${g} ${b}`
		guesses[currentGuess] = [0, 0, 0]
		console.log(`Generated color: ${oklchValues}`)
	})
</script>

<div class="container" class:light={!darkTheme} class:dark={darkTheme} style="--color: {colorRGB}">
	<div class="color-box"></div>
	{#each guesses as guess, i}
		<div class="guess">
			{#each guess as _, j}
				<div class="guess-value">
					<Counter
						bind:value={guess[j]}
						stepSize={stepSizes[j]}
						min={limits[j].min}
						max={limits[j].max}
						disabled={i !== currentGuess}
						unused={i > currentGuess}
						accent="rgb({colorRGB})"
					/>
					{#if i < currentGuess}
						<span class="judgement">{getDescriptor(j, guess[j] as number)}</span>
					{/if}
					<button onclick={submit}>Submit</button>
				</div>
			{/each}
		</div>
	{/each}
</div>

<svelte:head>
	<style>
		body {
			margin: 0;
			display: flex;
			justify-content: center;
			font-family: sans-serif;
			background-color: var(--background-light);
		}
	</style>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<style>
	:root {
		--background-light: #fff;
		--background-dark: #333;
		--text-light: #333;
		--text-dark: #fff;
	}

	.container.light {
		--background: var(--background-light);
		--text: var(--text-light);
		--correct: #b7d68d;
	}

	.container {
		max-width: 800px;
		padding: 20px;
	}

	.color-box {
		background-color: rgb(var(--color));
		width: 100%;
		height: 100px;
		margin-bottom: 8px;
	}

	.guess {
		display: flex;
		padding-top: 8px;
		gap: 20px;
	}

	.guess-value {
		display: flex;
		flex-direction: column;
		height: 100px;
	}

	.judgement {
		margin-top: 8px;
		text-align: center;
		animation: fadeAndGrow 0.3s ease-in-out 1;
	}

	@keyframes fadeAndGrow {
		0% {
			opacity: 0;
			height: 0;
		}
		100% {
			opacity: 1;
			height: 1lh;
		}
	}
</style>
