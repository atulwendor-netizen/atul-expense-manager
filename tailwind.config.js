/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38aaf6',
          500: '#0e8ee8',
          600: '#0270c6',
          700: '#0359a0',
          800: '#074c84',
          900: '#0c406e',
          950: '#082949',
        },
        nexa: {
          dark: '#05070f',
          darker: '#02040a',
          surface: '#0d1124',
          border: 'rgba(255, 255, 255, 0.08)',
          blue: '#3b82f6',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          cyan: '#06b6d4',
          emerald: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
