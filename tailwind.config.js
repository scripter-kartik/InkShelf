/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        playwrite: ['"Playwrite AU QLD"', "serif"],
        winky: ['"Winky Rough"', "serif"],
        intel: ['"Intel One Mono"', "Serif"],
        lato: ['"Lato"', "Serif"],
      },
    },
  },
  plugins: [],
};
