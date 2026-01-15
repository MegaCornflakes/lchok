/** Formats a date as "Month Day, Year" in NY time */
export function formatDate(date: Date) {
	return date.toLocaleDateString('en-US', {
		timeZone: 'America/New_York',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

/** Checks if two dates are on the same day in NY time */
export function sameDay(date: Date) {
	const now = new Date()
	return formatDate(now) === formatDate(date)
}
