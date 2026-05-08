/** Sendo design tokens — yellow + black motif preserved from legacy theme.css */
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
          'navbar-bg': '#111111',
          'sidebar-bg': '#111111',
          'sidebar-row': '#1a1a1a',
          row: '#fffbf0',
          page: '#f5f5f5',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        navbar: '0 2px 8px rgba(0,0,0,0.4)',
        sidebar: '2px 0 8px rgba(0,0,0,0.3)',
        page: '0px 4px 8px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
