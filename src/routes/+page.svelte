<script lang="ts">
	import { onMount } from 'svelte'
	import { game, loadGameFromStorage, saveGameToStorage } from './state.svelte'
	import Counter from '../components/Counter.svelte'
	import Chevron from '../components/Chevron.svelte'
	import Button from '../components/Button.svelte'
	import { fade, fly } from 'svelte/transition'
	import { goto } from '$app/navigation'
	import type { Three } from '$lib/types'
	import { formatDate, sameDay } from '$lib/date'

	type Direction = 'up' | 'down' | 'left' | 'right'

	type Judgement = {
		below: {
			direction: Direction
			text: string
		}
		above: {
			direction: Direction
			text: string
		}
	}

	const judgements: [Judgement, Judgement, Judgement] = [
		{ below: { direction: 'up', text: 'Lighter' }, above: { direction: 'down', text: 'Darker' } },
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
		{ min: 0, max: 340 }
	]

	let darkTheme = $state(false)
	let allowAnimations = $state(false)

	function arraysEqual(a: Array<number | undefined>, b: Three<number>): boolean {
		return a.length === b.length && a.every((val, i) => val === b[i])
	}

	function submit() {
		allowAnimations = true
		if (game.guesses[game.currentGuessIndex].some((v) => v === undefined)) {
			return
		}

		if (arraysEqual(game.guesses[game.currentGuessIndex], game.oklchValues)) {
			game.won = true
			game.ended = true
			saveGameToStorage()
			goto('/results')
		}

		if (!game.ended && game.currentGuessIndex + 1 < game.guesses.length) {
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

	function splitmix32(a: any) {
		return function () {
			a |= 0
			a = (a + 0x9e3779b9) | 0
			let t = a ^ (a >>> 16)
			t = Math.imul(t, 0x21f0aaad)
			t = t ^ (t >>> 15)
			t = Math.imul(t, 0x735a2d97)
			return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296
		}
	}

	// This section is written by Claude I'll blow up if something is wrong
	function linearSrgbToOklab(r: number, g: number, b: number): Three<number> {
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

	function oklabToLinearSrgb(L: number, a: number, b: number): Three<number> {
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

	function oklchToSrgb(L: number, C: number, h: number): Three<number> {
		const hRad = (h * Math.PI) / 180
		const a = C * Math.cos(hRad)
		const b = C * Math.sin(hRad)
		const rgbLinear = oklabToLinearSrgb(L, a, b)
		const rgbSrgb = rgbLinear.map((v) =>
			v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
		)
		return rgbSrgb.map((v) => Math.max(0, Math.min(255, v * 255))) as Three<number>
	}

	function isValidSrgb(rgb: Three<number>): boolean {
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

	function generateRandomOklchColor(): Three<number> {
		const rng = splitmix32(formatDate(game.date))
		const L = roundTo(rng(), 0.05)
		const h = roundTo(rng() * 340, 20)
		const maxChroma = findMaxChroma(L, h)
		const C = roundTo(rng() * maxChroma, 0.02)
		return [L, C, h]
	}
	// End Claude

	onMount(() => {
		if (sameDay(game.date) && loadGameFromStorage()) return

		game.oklchValues = generateRandomOklchColor()
		const [r, g, b] = oklchToSrgb(...game.oklchValues)
		game.colorRGB = `${r} ${g} ${b}`
		game.guesses[0] = [0, 0, 0]
		game.currentGuessIndex = 0
		saveGameToStorage()
		console.log(`Generated color: ${game.oklchValues}`)
	})
</script>

<div class="game" style="--color: {game.colorRGB}">
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
									disabled={i !== game.currentGuessIndex || game.ended}
									unused={i > game.currentGuessIndex ||
										(i === game.currentGuessIndex && game.ended)}
									accent="rgb({game.colorRGB})"
									correct={guess[j] === game.oklchValues[j] && i < game.currentGuessIndex}
								/>
							</div>
							{#if i < game.currentGuessIndex}
								{@const descriptor = getDescriptor(j, guess[j] as number)}
								{#if descriptor === 'Perfect'}
									<span class="judgement" class:animated={allowAnimations}>Perfect</span>
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
				{#if i === game.currentGuessIndex && !game.ended}
					<Button color="#5cc466" class="center-button" animated onclick={submit}>SUBMIT</Button>
				{/if}
			</div>
		{/each}
	</div>
	{#if game.ended}
		<Button
			color="#f05454"
			class="center-button"
			animated={allowAnimations}
			onclick={() => goto('/results')}>VIEW RESULTS</Button
		>
	{/if}
</div>

<style>
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
		box-sizing: border-box;
		grid-column: 1 / -1;
		border: 4px solid var(--foreground);
	}

	.column-labels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
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
		column-gap: 16px;
	}

	.guess {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
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
		min-width: max-content;
	}

	.judgement {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		max-width: 100%;
		font-family: 'Figtree', sans-serif;
		font-size: 16px;
		height: 36px;
	}

	.judgement.animated {
		animation: flyIn 300ms var(--exponential) 1;
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

	@media (max-height: 1000px) {
		.game {
			row-gap: 8px;
		}
	}
</style>
