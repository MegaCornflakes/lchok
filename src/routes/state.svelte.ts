interface GameState {
	colorRGB: string
	oklchValues: [number, number, number]
	guesses: (number | undefined)[][]
	currentGuessIndex: number
	won: boolean
}

export const game: GameState = $state({
	colorRGB: '150 150 150',
	oklchValues: [0, 0, 0],
	guesses: Array.from({ length: 5 }, () => Array(3).fill(undefined)),
	currentGuessIndex: 0,
	won: false
})
