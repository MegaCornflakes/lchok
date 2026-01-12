interface GameState {
	colorRGB: string
	oklchValues: [number, number, number]
	guesses: (number | undefined)[][]
	currentGuessIndex: number
	won: boolean
	ended: boolean
}

export const game: GameState = $state({
	colorRGB: '150 150 150',
	oklchValues: [0, 0, 0],
	guesses: Array.from({ length: 5 }, () => Array(3).fill(undefined)),
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
		Object.assign(game, parsedState)
		return true
	}

	return false
}

// Theme
export const theme = $state({
	current: 'system' as 'light' | 'dark' | 'system'
})
