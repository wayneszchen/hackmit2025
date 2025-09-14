/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./dist/**/*.html"],
  theme: {
    extend: {
      colors: {
        'eco-green': '#10B981',
        'eco-red': '#EF4444',
        'eco-yellow': '#F59E0B',
      }
    },
  },
  plugins: [],
}
