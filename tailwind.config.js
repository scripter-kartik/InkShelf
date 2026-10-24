module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f8f6",
          100: "#e6eeea",
          200: "#cfdcd5",
          300: "#b0c4ba",
          400: "#8aa298",
          500: "#6b8378",
          600: "#4f6159",
          700: "#2f3c36",
          800: "#1c2521",
          900: "#121916",
          950: "#080c0a",
        },
      },
      typography: ({ theme }) => ({
        ink: {
          css: {
            "--tw-prose-body": theme("colors.gray.700"),
            "--tw-prose-headings": theme("colors.gray.900"),
            "--tw-prose-bold": theme("colors.gray.900"),
            "--tw-prose-links": theme("colors.green.600"),
            "--tw-prose-bullets": theme("colors.green.500"),
            "--tw-prose-counters": theme("colors.green.600"),
            "--tw-prose-quotes": theme("colors.gray.900"),
            "--tw-prose-quote-borders": theme("colors.green.300"),
            "--tw-prose-hr": theme("colors.gray.200"),
            "--tw-prose-code": theme("colors.gray.900"),
            "--tw-prose-invert-body": theme("colors.ink.300"),
            "--tw-prose-invert-headings": theme("colors.ink.50"),
            "--tw-prose-invert-bold": theme("colors.ink.50"),
            "--tw-prose-invert-links": theme("colors.green.400"),
            "--tw-prose-invert-bullets": theme("colors.green.400"),
            "--tw-prose-invert-counters": theme("colors.green.400"),
            "--tw-prose-invert-quotes": theme("colors.ink.100"),
            "--tw-prose-invert-quote-borders": theme("colors.green.700"),
            "--tw-prose-invert-hr": theme("colors.ink.800"),
            "--tw-prose-invert-code": theme("colors.ink.50"),
          },
        },
      }),
      fontFamily: {
        playwrite: ["var(--font-playwrite)", "cursive"],
        winky: ["var(--font-winky)", "sans-serif"],
        lato: ["var(--font-lato)", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
