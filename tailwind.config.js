/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // THIS IS THE CRUCIAL LINE
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}