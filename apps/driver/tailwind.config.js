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
          page: '#f5f5f5',
        },
      },
    },
  },
  plugins: [],
};
