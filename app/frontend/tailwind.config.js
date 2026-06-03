import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      colors: {
        core: colors.stone,
        neon: {
          cyan: '#00f0ff',
          green: '#39ff14',
          red: '#ff003c',
          yellow: '#fcee0a',
          purple: '#b026ff',
        }
      }
    },
  },
  plugins: [],
}
