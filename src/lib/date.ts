export function formatDate(date: Date) {
	return date.toLocaleDateString('en-US', {
		timeZone: 'America/New_York',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

export function sameDay(date: Date) {
	const now = new Date()
	return formatDate(now) === formatDate(date)
}
