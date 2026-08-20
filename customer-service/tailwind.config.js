/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#031733',
          dark: '#070D1E',
          deep: '#0B1938',
          light: '#182C56',
        },
        gold: {
          DEFAULT: '#C5A059',
          light: '#EBD8B2',
          dark: '#8F6D2C',
          bright: '#D4AF37',
        },
        primary: {
          navy: '#031733',
          gold: '#C5A059',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Lao"', '"Sarabun"', 'sans-serif'],
        display: ['"Cormorant Garamond"', '"Noto Sans Lao"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        shine: 'shine 4s linear infinite',
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '100%' },
          '100%': { backgroundPosition: '-100%' },
        },
        'border-beam': {
          '100%': {
            offsetDistance: '100%',
          },
        },
      },
    },
  },
  plugins: [],
}
