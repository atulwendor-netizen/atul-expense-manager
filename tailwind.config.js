/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
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
        }
      }
    },
  },
  plugins: [],
}
