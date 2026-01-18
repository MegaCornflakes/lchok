import type { Three } from '$lib/types'

// Game
interface GameState {
	date: Date
	colorRGB: string
	oklchValues: Three<number>
	guesses: Three<number | undefined>[]
	currentGuessIndex: number
	won: boolean
	ended: boolean
}

export const game: GameState = $state({
	date: new Date(),
	colorRGB: '150 150 150',
	oklchValues: [0, 0, 0],
	guesses: Array.from({ length: 5 }, () => Array(3).fill(undefined)) as Three<number | undefined>[],
	currentGuessIndex: -1,
	won: false,
	ended: false
})

export function saveGameToStorage() {
	localStorage.setItem('game-state', JSON.stringify(game))
}

export function loadGameFromStorage() {
	const savedState = localStorage.getItem('game-state')
	if (savedState) {
		const parsedState: GameState = JSON.parse(savedState)
		parsedState.date = new Date(parsedState.date)
		Object.assign(game, parsedState)
		return true
	}

	return false
}

export function newGame() {
	return {
		date: new Date(),
		colorRGB: '150 150 150',
		oklchValues: [0, 0, 0],
		guesses: Array.from({ length: 5 }, () => Array(3).fill(undefined)) as Three<
			number | undefined
		>[],
		currentGuessIndex: -1,
		won: false,
		ended: false
	}
}

// Theme
export const theme = $state({
	current: 'system' as 'light' | 'dark' | 'system'
})
