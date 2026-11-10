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
    // Breakpoint allineati a style.css (720 / 1000 / 1500)
    screens: {
      md: '721px',
      lg: '1001px',
      xl: '1500px',
    },
    extend: {
      colors: {
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        sand: 'rgb(var(--color-sand) / <alpha-value>)',
        forest: 'rgb(var(--color-footer) / <alpha-value>)',
        // toni fissi del layout
        'ink-soft': '#68665e',
        muted: '#77756c',
        cue: '#6e675b',
        taupe: '#a29783',
        mist: '#e7e2d9',
        linen: '#efebe3',
        oat: '#ede7dc',
        pill: '#c9c0b0',
        rule: '#c8c3b7',
        field: '#c4beaf',
        cloud: '#efeee7',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
