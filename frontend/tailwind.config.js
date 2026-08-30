/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        government: {
          blue: '#1e3a8a',
          slate: '#0f172a',
          indigo: '#4f46e5',
        }
      }
    },
  },
  plugins: [],
}
