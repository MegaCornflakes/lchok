<script lang="ts">
	import { theme } from '../routes/state.svelte'

	function setTheme(newTheme: 'light' | 'dark' | 'system') {
		theme.current = newTheme
		localStorage.setItem('theme', newTheme)
	}
</script>

<div id="theme-selector">
	<button id="light" class:active={theme.current === 'light'} onmousedown={() => setTheme('light')}>
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="9" fill="black" />
		</svg>
	</button>
	<button id="dark" class:active={theme.current === 'dark'} onmousedown={() => setTheme('dark')}>
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M10 3C14.9706 3 19 7.02944 19 12C19 16.9706 14.9706 21 10 21C8.9478 21 7.93856 20.8172 7 20.4854C10.4952 19.2496 13 15.9184 13 12C13 8.08153 10.4953 4.74932 7 3.51367C7.93847 3.18191 8.94791 3 10 3Z"
				fill="black"
			/>
		</svg>
	</button>
	<button
		id="system"
		class:active={theme.current === 'system'}
		onmousedown={() => setTheme('system')}
	>
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="5" y="16" width="14" height="5" fill="black" />
			<path d="M21 14H3V3H21V14ZM5 5V12H19V5H5Z" fill="black" />
		</svg>
	</button>
</div>

<style>
	#theme-selector {
		display: flex;
		border: 4px solid var(--foreground);
		height: 28px;
	}

	#theme-selector > button {
		flex: 1;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	#theme-selector > button:hover {
		background-color: var(--foreground);
	}

	#theme-selector > button.active {
		background-color: var(--foreground);
	}

	svg {
		height: 100%;
		width: 100%;
	}

	svg rect,
	svg path,
	svg circle {
		fill: var(--foreground);
	}

	#theme-selector > button:hover svg rect,
	#theme-selector > button:hover svg path,
	#theme-selector > button:hover svg circle {
		fill: var(--background);
	}

	#theme-selector > button.active svg rect,
	#theme-selector > button.active svg path,
	#theme-selector > button.active svg circle {
		fill: var(--background);
	}
</style>
