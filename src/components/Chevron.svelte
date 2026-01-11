<script lang="ts">
	type Props = {
		direction: 'up' | 'down' | 'left' | 'right'
	}

	let { direction }: Props = $props()
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="chevron {direction}">
	<rect width="24" height="24" />
	<path d="M5 16L12 9L19 16" />
</svg>

<style>
	.chevron {
		width: 24px;
		height: 24px;
	}

	.chevron > rect {
		fill: black;
	}

	.chevron > path {
		stroke: white;
		stroke-width: 4px;
	}

	.chevron.up {
		transform: rotate(0deg);
	}
	.chevron.down {
		transform: rotate(180deg);
	}
	.chevron.left {
		transform: rotate(-90deg);
	}
	.chevron.right {
		transform: rotate(90deg);
	}
</style>
