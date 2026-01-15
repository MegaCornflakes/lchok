# LCH, OK?

A daily -dle-like color guessing game where you guess colors in your favorite color space, OKLCH.

![Game Screenshot](https://placeholder.com/lchok-screenshot.png)

## How to Play

Each day, a new random color is generated. Your goal is to guess the color by entering its OKLCH values:

- **Luminance (L)**: 0 to 1 - Controls the brightness of the color
- **Chroma (C)**: 0 to 0.4 - Controls the saturation/intensity of the color
- **Hue (H)**: 0 to 340 - Controls the hue angle on the color wheel (360 is left out to avoid overlap)

After each guess, you'll receive feedback indicating whether each value should be higher or lower. You have 5 attempts to guess the exact color.

## What's in it?

- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Svelte 5](https://svelte.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)

## Development

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh/) (recommended) or npm

### Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## License

[MIT](LICENSE)
