/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0D0B14',
        surface: '#161224',
        surfaceBorder: '#27203B',
        accentViolet: '#A855F7',
        accentPurple: '#8B5CF6',
        lilac: '#A78BFA',
      },
    },
  },
  plugins: [],
}