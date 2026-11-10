/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        // Forto brand orange (sampled from the official logo: #F7931E).
        brand: {
          200: '#FFD9A8',
          300: '#FFC27A',
          400: '#FFA640',
          500: '#F7931E',
          600: '#E07A10',
          700: '#B45A0E',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        // Heavy condensed sans, matching the signage lettering on the Forto building.
        wordmark: ['"Barlow Condensed"', 'Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brand: '0 0 40px -8px rgba(247, 147, 30, 0.45)',
      },
    },
  },
  plugins: [],
};
