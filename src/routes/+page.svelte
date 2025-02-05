<script lang="ts">
	import { onMount } from 'svelte'

	type Vec3 = [number, number, number]

	const judgements = [
		{ below: '⬆️ Lighter', above: '⬇️ Darker' },
		{ below: '⬆️ More saturated', above: '⬇️ Less saturated' },
		{ below: '➡️ Further right', above: '⬅️ Further left' }
	]

	let darkTheme = $state(false)
	let color = $state('150 150 150')
	let oklchValues: Vec3 = $state([0, 0, 0])
	let guesses: Array<Array<number | null>> = $state(new Array(5).fill(new Array(3).fill(null)))
	let currentGuess = $state(0)
	let displayMissing = $state(false)
	let won = $state(false)

	function submit() {
		if (guesses[currentGuess].includes(null)) {
			displayMissing = true
			return
		}

		if (guesses[currentGuess].join(',') === oklchValues.join(',')) {
			won = true
		}

		guesses[currentGuess].forEach((value, i) => {
			if (value === oklchValues[i] && currentGuess + 1 < guesses.length && !won)
				guesses[currentGuess + 1][i] = value
		})

		displayMissing = false
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
		color = `${r} ${g} ${b}`
		console.log(`Generated color: ${oklchValues}`)
	})
</script>

<div class="container" class:light={!darkTheme} class:dark={darkTheme} style="--color: {color}">
	<div class="color-box"></div>
	{#each guesses as guess, i}
		<div class="guess">
			{#each guess as color, j}
				<div class="guess-value">
					<input
						type="number"
						inputmode="numeric"
						bind:value={guess[j]}
						disabled={currentGuess != i || won}
						onkeydown={handleKeydown}
						class:not-judged={i >= currentGuess}
						class:missing={displayMissing && guess[j] === null}
						class:correct={guess[j] === oklchValues[j] && i < currentGuess}
					/>
					{#if i < currentGuess}
						<span class="judgement">{getDescriptor(j, guess[j] as number)}</span>
					{/if}
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
		border-radius: 8px;
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

	.guess input {
		padding: 4px;
		max-width: 200px;
		border-radius: 8px;
		border: solid #ccc;
		border-width: 1px;
		-moz-appearance: textfield;
		appearance: textfield;
		box-shadow: 2px 2px 4px -2px rgba(0, 0, 0, 0.2);
		flex-grow: 1;
		text-align: center;
		font-size: 1.5em;
		transition:
			background-color 0.3s ease-in-out,
			box-shadow 0.3s ease-in-out,
			color 0.3s ease-in-out;
	}

	/* Hide spinner buttons in Chrome, Safari, Edge, Opera */
	.guess input::-webkit-outer-spin-button,
	.guess input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.guess input:disabled {
		box-shadow: none;
	}

	.guess input:focus {
		outline: rgb(var(--color) / 0.4) solid 4px;
	}

	.not-judged {
		margin-bottom: 8px;
	}

	.guess .missing:not(:disabled) {
		padding: 1px;
		border: solid rgb(255 115 100);
		border-width: 4px;
	}

	.guess .missing:focus {
		outline: rgb(255 115 100 / 0.5) solid 4px;
	}

	.guess .correct {
		background-color: var(--correct);
		border: 1px solid oklch(from var(--correct) calc(l * 0.8) c h);
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
