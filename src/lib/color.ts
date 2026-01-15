import type { Three } from './types'

/**
 * Matrix coefficients for linear sRGB to Oklab conversion
 * These are derived from the Oklab color space specification
 */
const SRGB_TO_LMS = {
	l: [0.4122214708, 0.5363325363, 0.0514459929],
	m: [0.2119034982, 0.6806995451, 0.1073969566],
	s: [0.0883024619, 0.2817188376, 0.6299787005]
} as const

const LMS_TO_OKLAB = {
	L: [0.2104542553, 0.793617785, -0.0040720468],
	a: [1.9779984951, -2.428592205, 0.4505937099],
	b: [0.0259040371, 0.7827717662, -0.808675766]
} as const

const OKLAB_TO_LMS = {
	l: [1, 0.3963377774, 0.2158037573],
	m: [1, -0.1055613458, -0.0638541728],
	s: [1, -0.0894841775, -1.291485548]
} as const

const LMS_TO_SRGB = {
	r: [4.0767416621, -3.3077115913, 0.2309699292],
	g: [-1.2684380046, 2.6097574011, -0.3413193965],
	b: [-0.0041960863, -0.7034186147, 1.707614701]
} as const

/** Linear sRGB threshold for gamma correction */
const LINEAR_SRGB_THRESHOLD = 0.0031308

/** Maximum chroma bound for OKLCH (reasonable upper limit) */
export const MAX_CHROMA_BOUND = 0.4

/**
 * Converts linear sRGB values to Oklab color space
 * @param r - Red channel (0-1)
 * @param g - Green channel (0-1)
 * @param b - Blue channel (0-1)
 * @returns Oklab [L, a, b] values
 */
export function linearSrgbToOklab(r: number, g: number, b: number): Three<number> {
	const l = SRGB_TO_LMS.l[0] * r + SRGB_TO_LMS.l[1] * g + SRGB_TO_LMS.l[2] * b
	const m = SRGB_TO_LMS.m[0] * r + SRGB_TO_LMS.m[1] * g + SRGB_TO_LMS.m[2] * b
	const s = SRGB_TO_LMS.s[0] * r + SRGB_TO_LMS.s[1] * g + SRGB_TO_LMS.s[2] * b

	const lCbrt = Math.cbrt(l)
	const mCbrt = Math.cbrt(m)
	const sCbrt = Math.cbrt(s)

	return [
		LMS_TO_OKLAB.L[0] * lCbrt + LMS_TO_OKLAB.L[1] * mCbrt + LMS_TO_OKLAB.L[2] * sCbrt,
		LMS_TO_OKLAB.a[0] * lCbrt + LMS_TO_OKLAB.a[1] * mCbrt + LMS_TO_OKLAB.a[2] * sCbrt,
		LMS_TO_OKLAB.b[0] * lCbrt + LMS_TO_OKLAB.b[1] * mCbrt + LMS_TO_OKLAB.b[2] * sCbrt
	]
}

/**
 * Converts Oklab color space to linear sRGB
 * @param L - Lightness (0-1)
 * @param a - Green-red axis
 * @param b - Blue-yellow axis
 * @returns Linear sRGB [r, g, b] values
 */
export function oklabToLinearSrgb(L: number, a: number, b: number): Three<number> {
	const lCbrt = OKLAB_TO_LMS.l[0] * L + OKLAB_TO_LMS.l[1] * a + OKLAB_TO_LMS.l[2] * b
	const mCbrt = OKLAB_TO_LMS.m[0] * L + OKLAB_TO_LMS.m[1] * a + OKLAB_TO_LMS.m[2] * b
	const sCbrt = OKLAB_TO_LMS.s[0] * L + OKLAB_TO_LMS.s[1] * a + OKLAB_TO_LMS.s[2] * b

	const l = lCbrt ** 3
	const m = mCbrt ** 3
	const s = sCbrt ** 3

	return [
		LMS_TO_SRGB.r[0] * l + LMS_TO_SRGB.r[1] * m + LMS_TO_SRGB.r[2] * s,
		LMS_TO_SRGB.g[0] * l + LMS_TO_SRGB.g[1] * m + LMS_TO_SRGB.g[2] * s,
		LMS_TO_SRGB.b[0] * l + LMS_TO_SRGB.b[1] * m + LMS_TO_SRGB.b[2] * s
	]
}

/**
 * Applies gamma correction to convert linear sRGB to sRGB
 * @param value - Linear sRGB value (0-1)
 * @returns Gamma-corrected sRGB value (0-1)
 */
function linearToGamma(value: number): number {
	return value <= LINEAR_SRGB_THRESHOLD ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}

/**
 * Converts OKLCH color to sRGB (0-255 range)
 * @param L - Lightness (0-1)
 * @param C - Chroma (0-~0.4)
 * @param h - Hue angle in degrees (0-360)
 * @returns sRGB [r, g, b] values (0-255)
 */
export function oklchToSrgb(L: number, C: number, h: number): Three<number> {
	const hRad = (h * Math.PI) / 180
	const a = C * Math.cos(hRad)
	const b = C * Math.sin(hRad)

	const rgbLinear = oklabToLinearSrgb(L, a, b)
	const rgbGamma = rgbLinear.map(linearToGamma)

	return rgbGamma.map((v) => Math.round(Math.max(0, Math.min(255, v * 255)))) as Three<number>
}

/**
 * Checks if RGB values are within valid sRGB gamut
 * @param rgb - RGB values (0-255)
 * @returns True if all values are in valid range
 */
export function isValidSrgb(rgb: Three<number>): boolean {
	return rgb.every((v) => v >= 0 && v <= 255)
}

/**
 * Finds the maximum chroma for a given lightness and hue that stays within sRGB gamut
 * Uses binary search for efficiency
 * @param L - Lightness (0-1)
 * @param h - Hue angle in degrees
 * @param tolerance - Search precision (default: 0.001)
 * @returns Maximum valid chroma value
 */
export function findMaxChroma(L: number, h: number, tolerance = 0.001): number {
	let low = 0
	let high = MAX_CHROMA_BOUND

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

/**
 * Formats RGB values as a space-separated string
 * @param rgb - RGB values (0-255)
 * @returns String like "255 128 64"
 */
export function formatRgbString(rgb: Three<number>): string {
	return rgb.join(' ')
}
