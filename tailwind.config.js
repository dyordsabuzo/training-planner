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
    extend: {},
  },
  plugins: [],
};
