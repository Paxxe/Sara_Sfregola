/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './layout/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './templates/**/*.{liquid,json}',
    './assets/theme.js',
  ],
  theme: {
    extend: {
      colors: {
        ivory: 'rgb(var(--color-bg) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        stone: 'rgb(var(--color-muted) / <alpha-value>)',
        sand: 'rgb(var(--color-accent) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        sans: ['var(--font-sans)'],
      },
      letterSpacing: {
        eyebrow: '0.28em',
      },
      maxWidth: {
        page: '1600px',
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(.77,0,.18,1)',
      },
    },
  },
  plugins: [],
};
