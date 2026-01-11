<script lang="ts">
	import { onMount } from 'svelte'
	import { game, loadGameFromStorage, saveGameToStorage } from './state.svelte'
	import Counter from '../components/Counter.svelte'
	import Chevron from '../components/Chevron.svelte'
	import Button from '../components/Button.svelte'
	import { fade, fly } from 'svelte/transition'

	type Vec3 = [number, number, number]
	type Dir = 'up' | 'down' | 'left' | 'right'
	type Judgement = {
		below: {
			direction: Dir
			text: string
		}
		above: {
			direction: Dir
			text: string
		}
	}

	const judgements: [Judgement, Judgement, Judgement] = [
		{ below: { direction: 'up', text: 'Lighter' }, above: { direction: 'down', text: 'Dark' } },
		{
			below: { direction: 'up', text: 'More chroma' },
			above: { direction: 'down', text: 'Less chroma' }
		},
		{
			below: { direction: 'right', text: 'Further right' },
			above: { direction: 'left', text: 'Further left' }
		}
	]
	const stepSizes = [0.05, 0.02, 20]
	const limits = [
		{ min: 0, max: 1 },
		{ min: 0, max: 0.4 },
		{ min: 0, max: 360 }
	]

	let darkTheme = $state(false)

	function arraysEqual(a: Array<number | undefined>, b: Vec3): boolean {
		return a.length === b.length && a.every((val, i) => val === b[i])
	}

	function submit() {
		if (game.guesses[game.currentGuessIndex].some((v) => v === undefined)) {
			return
		}

		if (arraysEqual(game.guesses[game.currentGuessIndex], game.oklchValues)) {
			game.won = true
			game.ended = true
		}

		if (!game.won && game.currentGuessIndex + 1 < game.guesses.length) {
			game.guesses[game.currentGuessIndex].forEach((value, i) => {
				game.guesses[game.currentGuessIndex + 1][i] = value
			})
		}

		game.currentGuessIndex += 1
		if (game.currentGuessIndex === game.guesses.length) {
			game.ended = true
		}

		saveGameToStorage()
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			submit()
		}
	}

	function getDescriptor(index: number, value: number) {
		const { below, above } = judgements[index]
		const oklchValue = game.oklchValues[index]
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
		if (loadGameFromStorage()) return

		game.oklchValues = generateRandomOklchColor()
		const [r, g, b] = oklchToSrgb(...game.oklchValues)
		game.colorRGB = `${r} ${g} ${b}`
		game.guesses[0] = [0, 0, 0]
		game.currentGuessIndex = 0
		console.log(`Generated color: ${game.oklchValues}`)
	})

	$inspect(game.currentGuessIndex)
</script>

<div class="game" class:light={!darkTheme} class:dark={darkTheme} style="--color: {game.colorRGB}">
	<Button
		onclick={() => {
			localStorage.removeItem('game-state')
			location.reload()
		}}
		class="center-button">NEW GAME</Button
	>
	<div class="color-box"></div>
	<div class="guess-container">
		<div class="column-labels">
			<span class="label">L</span>
			<span class="label">C</span>
			<span class="label">H</span>
		</div>
		{#each game.guesses as guess, i}
			<div class="current-guess">
				<div class="guess">
					{#each guess as _, j}
						<div class="guess-value">
							<div class="counter-wrapper">
								<Counter
									bind:value={guess[j]}
									stepSize={stepSizes[j]}
									min={limits[j].min}
									max={limits[j].max}
									disabled={i !== game.currentGuessIndex}
									unused={i > game.currentGuessIndex}
									accent="rgb({game.colorRGB})"
								/>
							</div>
							{#if i < game.currentGuessIndex}
								{@const descriptor = getDescriptor(j, guess[j] as number)}
								{#if descriptor === 'Perfect'}
									<span class="judgement">Perfect</span>
								{:else if descriptor}
									<span class="judgement">
										<Chevron direction={descriptor.direction} />
										<span class="judgement-text">{descriptor.text}</span>
									</span>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
				{#if i === game.currentGuessIndex}
					<Button color="#5cc466" class="center-button" onclick={submit}>SUBMIT</Button>
				{/if}
			</div>
		{/each}
	</div>
	{#if game.ended}
		<Button color="#f05454" class="center-button" onclick={() => location.reload()}>
			VIEW RESULTS
		</Button>
	{/if}
</div>

<svelte:head>
	<style>
		body {
			margin: 0;
			display: flex;
			justify-content: center;
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
		--exponential: cubic-bezier(0.16, 1, 0.3, 1);
	}

	.game.light {
		--background: var(--background-light);
		--text: var(--text-light);
		--correct: #b7d68d;
	}

	.game {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		width: 100%;
		overflow: hidden;
		gap: 16px;
	}

	.color-box {
		background-color: rgb(var(--color));
		width: 100%;
		height: 100px;
		grid-column: 1 / -1;
	}

	.column-labels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
		font-size: 2rem;
		font-weight: bold;
	}

	.label {
		text-align: center;
	}

	.guess-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		grid-column: 1 / -1;
	}

	.current-guess {
		display: grid;
		flex-direction: column;
		grid-template-columns: repeat(3, 1fr);
		column-gap: 20px;
	}

	.guess {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
		grid-column: 1 / -1;
	}

	.guess-value {
		display: flex;
		flex-direction: column;
		flex: 1 0 0;
	}

	.counter-wrapper {
		display: flex;
		margin-bottom: 8px;
	}

	:global(.center-button) {
		grid-column: 2 / 3;
		animation: fadeAndGrow 300ms var(--exponential) 1;
	}

	.judgement {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		max-width: 100%;
		animation: flyIn 300ms var(--exponential) 1;
		font-family: 'Figtree', sans-serif;
		font-size: 16px;
		height: 36px;
	}

	.judgement-text {
		max-width: calc(100% - 36px);
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

	@keyframes flyIn {
		0% {
			opacity: 0;
			transform: translateY(-50%);
		}
		100% {
			opacity: 1;
			transform: translateY(0%);
		}
	}

	@media (max-width: 600px) {
		.guess {
			gap: 8px;
		}

		.judgement {
			height: 48px;
			animation: fadeAndGrowLarge 300ms var(--exponential) 1;
		}

		:global(.center-button) {
			height: 48px;
		}

		@keyframes fadeAndGrowLarge {
			0% {
				opacity: 0;
				height: 0px;
			}
			100% {
				opacity: 1;
				height: 48px;
			}
		}
	}
</style>
