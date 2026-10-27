/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@dyordsabuzo/ui-components/tailwind.preset")],
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.stories.{js,ts,jsx,tsx}",
    "./node_modules/@dyordsabuzo/ui-components/dist/**/*.{js,mjs}",
  ],
  theme: {
    extend: {
      // Week paging in the Home day strip (DayStrip.tsx).
      keyframes: {
        "slide-from-right": {
          from: { transform: "translateX(40%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-from-left": {
          from: { transform: "translateX(-40%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-from-right": "slide-from-right 250ms ease-out",
        "slide-from-left": "slide-from-left 250ms ease-out",
      },
    },
  },
  plugins: [],
};
