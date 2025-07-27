/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.{css}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playwrite: ['"Playwrite AU QLD"', "serif"],
        winky: ['"Winky Rough"', "serif"]
      },
    },
  },
  plugins: [],
};
