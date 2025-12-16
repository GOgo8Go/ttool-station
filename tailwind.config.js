/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          900: 'var(--color-primary-900)',
        },
        'dark-bg': {
          900: 'var(--color-dark-bg-900)',
          800: 'var(--color-dark-bg-800)',
          700: 'var(--color-dark-bg-700)',
        }
      }
    }
  },
  plugins: [],
}