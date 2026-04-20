import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-roboto)', 'Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#e8eef7',
          100: '#c5d3ea',
          200: '#9fb5db',
          300: '#7897cb',
          400: '#5b80be',
          500: '#3e69b2',
          600: '#3460a8',
          700: '#27529b',
          800: '#1a3a5c',
          900: '#0f2540',
          950: '#09162a',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
