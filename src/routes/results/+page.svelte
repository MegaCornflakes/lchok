<script lang="ts">
	import { onMount } from 'svelte'
	import { game, loadGameFromStorage } from '../state.svelte'
	import Button from '../../components/Button.svelte'
	import { goto } from '$app/navigation'

	let validGuesses = $derived(game.guesses.filter((guess) => guess.every((v) => v)))

	onMount(() => {
		// Get the game state from storage
		loadGameFromStorage()

		if (!game.ended) {
			// If the game hasn't ended, redirect to the main page
			goto('/')
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

	<Button color="#f05454" class="hamburger" onclick={() => goto('/')}>GO BACK</Button>
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
		flex-direction: column;
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
		background-color: rgb(255 255 255 / 0.75);
		color: black;
		font-weight: bold;
	}
</style>
