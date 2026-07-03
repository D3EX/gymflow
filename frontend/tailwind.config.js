/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        secondary: '#fb923c',
        dark: '#0a0a0f',
        dark2: '#111118',
        dark3: '#1a1a24',
      }
    },
  },
  plugins: [],
}