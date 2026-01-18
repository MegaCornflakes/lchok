<script lang="ts">
	import { onMount } from 'svelte'
	import { game, loadGameFromStorage } from '../state.svelte'
	import Button from '../../components/Button.svelte'
	import { goto } from '$app/navigation'
	import type { Three } from '$lib/types'
	import { formatDate } from '$lib/date'

	// State

	let validGuesses = $derived(
		game.guesses.filter((guess) => guess.every((v) => v || v === 0)) as Three<number>[]
	)

	let copied = $state(false)

	// Helper Functions

	/** Converts a guess to an emoji */
	function guessToEmoji(guess: Three<number>) {
		const emoji = guess
			.map((v, i) => {
				if (v < game.oklchValues[i]) {
					return i !== 2 ? '\u2B07\uFE0F' : '\u2B05\uFE0F' // Down Arrow (L, C) or Left Arrow (H)
				} else if (v > game.oklchValues[i]) {
					return i !== 2 ? '\u2B06\uFE0F' : '\u27A1\uFE0F' // Up Arrow (L, C) or Right Arrow (H)
				} else {
					return '\u2705' // Checkmark
				}
			})
			.join('')
		return emoji
	}

	/** Copies the results to the clipboard */
	function copyResults() {
		const beginning = `https://cornflake.club/lchok/\nLCH, OK? ${formatDate(game.date)}\n`
		const text = validGuesses.map((guess) => guessToEmoji(guess)).join('\n')
		navigator.clipboard.writeText(beginning + text).then(() => (copied = true))
	}

	// Lifecycle

	onMount(() => {
		// Get the game state from storage
		loadGameFromStorage()

		if (!game.ended) {
			// If the game hasn't ended, redirect to the main page
			goto('/lchok')
		}
	})
</script>

<div id="results">
	<h1>
		{#if game.won}Success!{:else}Next time...{/if}
	</h1>

	<div id="guess-colors">
		{#each validGuesses as guess, i}
			<div class="result-item" style="background-color: oklch({guess[0]} {guess[1]} {guess[2]})">
				<span class="result-label">{i + 1}</span>
			</div>
		{/each}

		<div
			class="result-item"
			style="background-color: oklch({game.oklchValues[0]} {game.oklchValues[1]} {game
				.oklchValues[2]})"
		>
			<span class="result-label">Target Color</span>
		</div>
	</div>

	<div id="results-actions">
		<Button color="#f05454" class="go-back" onclick={() => goto('/lchok')}>GO BACK</Button>
		<Button color="#5454f0" class="copy-results" onclick={copyResults}
			>{copied ? 'COPIED' : 'COPY RESULTS'}</Button
		>
	</div>
</div>

<style>
	#results {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	h1 {
		margin: 0;
	}

	#guess-colors {
		width: 100%;
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
		border: 4px solid var(--foreground);
	}

	.result-item {
		width: 100%;
		height: 48px;
		padding: 8px;
		box-sizing: border-box;
	}

	.result-label {
		width: fit-content;
		height: 100%;
		box-sizing: border-box;
		display: block;
		text-align: center;
		align-content: center;
		padding: 4px 8px;
		background-color: rgb(from var(--background) r g b / 0.75);
		color: var(--foreground);
		font-weight: bold;
	}

	#results-actions {
		display: grid;
		width: 100%;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	:global(.go-back) {
		grid-column: 1 / 2;
	}

	:global(.copy-results) {
		grid-column: 3 / 4;
	}

	@media (max-width: 600px) {
		#results {
			gap: 8px;
		}

		:global(.copy-results) {
			grid-column: 2 / 4;
		}
	}
</style>
