<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'

	import { game, loadGameFromStorage, saveGameToStorage } from './state.svelte'
	import { oklchToSrgb, findMaxChroma, formatRgbString } from '$lib/color'
	import { createSeededRng, hashString, roundToStep } from '$lib/random'
	import { formatDate, sameDay } from '$lib/date'
	import type { Three } from '$lib/types'

	import Counter from '../components/Counter.svelte'
	import Chevron from '../components/Chevron.svelte'
	import Button from '../components/Button.svelte'

	// ─────────────────
	// Types + Constants
	// ─────────────────

	type Direction = 'up' | 'down' | 'left' | 'right'

	interface Judgement {
		below: { direction: Direction; text: string }
		above: { direction: Direction; text: string }
	}

	/** OKLCH component labels and their corresponding judgement hints */
	const JUDGEMENTS: Three<Judgement> = [
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

	/** Step sizes for [L, C, H] components */
	const STEP_SIZES: Three<number> = [0.05, 0.02, 20]

	/** Valid ranges for [L, C, H] components */
	const LIMITS: Three<{ min: number; max: number }> = [
		{ min: 0, max: 1 },
		{ min: 0, max: 0.4 },
		{ min: 0, max: 340 }
	]

	/** Maximum hue value for random generation */
	const MAX_HUE = 340

	// ─────
	// State
	// ─────

	let allowAnimations = $state(false)

	// ────────────────
	// Helper Functions
	// ────────────────

	function arraysEqual(a: Array<number | undefined>, b: Three<number>): boolean {
		return a.length === b.length && a.every((val, i) => val === b[i])
	}

	/**
	 * Determines the hint to show for a guessed value
	 * @returns 'Perfect' if exact match, direction hint otherwise
	 */
	function getDescriptor(index: number, value: number): Judgement['below'] | 'Perfect' | undefined {
		const oklchValue = game.oklchValues[index]

		if (value === oklchValue) return 'Perfect'
		if (value < oklchValue) return JUDGEMENTS[index].below
		if (value > oklchValue) return JUDGEMENTS[index].above
	}

	/**
	 * Generates a deterministic random OKLCH color based on the game date
	 */
	function generateRandomOklchColor(): Three<number> {
		const seed = hashString(formatDate(game.date))
		const rng = createSeededRng(seed)

		const L = roundToStep(rng(), STEP_SIZES[0])
		const h = roundToStep(rng() * MAX_HUE, STEP_SIZES[2])
		const maxChroma = findMaxChroma(L, h)
		const C = roundToStep(rng() * maxChroma, STEP_SIZES[1])

		return [L, C, h]
	}

	// ──────────
	// Game Logic
	// ──────────

	function submit() {
		allowAnimations = true
		const currentGuess = game.guesses[game.currentGuessIndex]

		// Validate all values are filled
		if (currentGuess.some((v) => v === undefined)) {
			return
		}

		// Check for win condition
		if (arraysEqual(currentGuess, game.oklchValues)) {
			game.won = true
			game.ended = true
			saveGameToStorage()
			goto('/results')
			return
		}

		// Copy current guess values to next row (if available)
		const hasNextGuess = game.currentGuessIndex + 1 < game.guesses.length
		if (!game.ended && hasNextGuess) {
			const nextGuess = game.guesses[game.currentGuessIndex + 1]
			currentGuess.forEach((value, i) => {
				nextGuess[i] = value
			})
		}

		// Advance to next guess
		game.currentGuessIndex += 1
		if (game.currentGuessIndex === game.guesses.length) {
			game.ended = true
		}

		saveGameToStorage()
	}

	// ─────────
	// Lifecycle
	// ---------

	onMount(() => {
		// Try to load existing game for today
		if (sameDay(game.date) && loadGameFromStorage()) {
			return
		}

		// Initialize new game
		game.oklchValues = generateRandomOklchColor()
		game.colorRGB = formatRgbString(oklchToSrgb(...game.oklchValues))
		game.guesses[0] = [0, 0, 0]
		game.currentGuessIndex = 0
		saveGameToStorage()
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
			{@const isCurrentRow = i === game.currentGuessIndex}
			{@const isPastRow = i < game.currentGuessIndex}
			{@const isDisabled = !isCurrentRow || game.ended}
			{@const isUnused = i > game.currentGuessIndex || (isCurrentRow && game.ended)}
			<div class="current-guess">
				<div class="guess">
					{#each guess as _, j}
						<div class="guess-value">
							<div class="counter-wrapper">
								<Counter
									bind:value={guess[j]}
									stepSize={STEP_SIZES[j]}
									min={LIMITS[j].min}
									max={LIMITS[j].max}
									disabled={isDisabled}
									unused={isUnused}
									accent="rgb({game.colorRGB})"
									correct={guess[j] === game.oklchValues[j] && isPastRow}
								/>
							</div>
							{#if isPastRow}
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
				{#if isCurrentRow && !game.ended}
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
