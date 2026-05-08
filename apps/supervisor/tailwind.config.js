/** Sendo design tokens — yellow + black motif preserved from legacy */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sendo: {
          yellow: '#FFC107',
          'yellow-dark': '#e6ac00',
          black: '#000000',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', '"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
