/**
 * Seeded random number generation utilities
 * Using splitmix32 algorithm for deterministic, reproducible sequences
 */

/** Splitmix32 magic constants (derived from the golden ratio and other properties) */
const SPLITMIX32_INCREMENT = 0x9e3779b9
const SPLITMIX32_MIX1 = 0x21f0aaad
const SPLITMIX32_MIX2 = 0x735a2d97

/** Maximum 32-bit unsigned integer for normalization */
const UINT32_MAX = 4294967296

/**
 * Creates a seeded pseudo-random number generator using the splitmix32 algorithm.
 * This provides fast, high-quality randomness suitable for games and simulations.
 *
 * @param seed - The initial seed value (integer)
 * @returns A function that returns random numbers in the range [0, 1)
 *
 * @example
 * ```ts
 * const rng = createSeededRng(12345)
 * console.log(rng()) // Always produces the same sequence for the same seed
 * console.log(rng())
 * ```
 */
export function createSeededRng(seed: number): () => number {
	let state = seed | 0 // Ensure integer

	return () => {
		// Mix the state
		state = (state + SPLITMIX32_INCREMENT) | 0

		// Apply mixing transformations
		let result = state ^ (state >>> 16)
		result = Math.imul(result, SPLITMIX32_MIX1)
		result = result ^ (result >>> 15)
		result = Math.imul(result, SPLITMIX32_MIX2)
		result = result ^ (result >>> 15)

		// Normalize to [0, 1)
		return (result >>> 0) / UINT32_MAX
	}
}

/**
 * Computes a simple hash of a string using the djb2 variant algorithm.
 * This produces a 32-bit integer hash suitable for seeding RNGs.
 *
 * @param str - The string to hash
 * @returns A 32-bit integer hash value
 *
 * @example
 * ```ts
 * const hash = hashString("January 15, 2026")
 * const rng = createSeededRng(hash)
 * ```
 */
export function hashString(str: string): number {
	let hash = 0

	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		// hash * 31 + char (using bit operations for speed)
		hash = ((hash << 5) - hash + char) | 0
	}

	return hash
}

/** Get the number of decimal places in a number */
export function getPrecision(num: number): number {
	const str = num.toString()
	const decimal = str.indexOf('.')
	return decimal === -1 ? 0 : str.length - decimal - 1
}

/** Round a number to a specified precision */
export function roundToPrecision(num: number, precision: number): number {
	const factor = 10 ** precision
	return Math.round(num * factor) / factor
}

/**
 * Rounds a value to the nearest step
 * @param value - The value to round
 * @param step - The step size
 * @returns Rounded value
 */
export function roundToStep(value: number, step: number): number {
	const precision = getPrecision(step)
	return roundToPrecision(Math.round(value / step) * step, precision)
}
