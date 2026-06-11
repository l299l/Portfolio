/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/l299l/portfolio/**/*.html", "./src/l299l/portfolio/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        dosis: ['Dosis', 'sans-serif'],
      },
      screens: {
        'very-small': '200px',
      },
    },
  },
  plugins: [],
}
