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
        // Train page: content under a newly chosen plan (SessionPage.tsx).
        "fade-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        // Timer ring: drains over the timer's length (set inline), blue → amber
        // at half → red at a quarter left, matching ringColor in Timer.tsx.
        "ring-drain": {
          "0%": { strokeDashoffset: "0" },
          "0%, 25%": { stroke: "#004777" },
          "50%": { stroke: "#F7B801" },
          "75%, 100%": { stroke: "#A30000" },
          "100%": { strokeDashoffset: "var(--ring-length)" },
        },
      },
      animation: {
        "slide-from-right": "slide-from-right 250ms ease-out",
        "slide-from-left": "slide-from-left 250ms ease-out",
        "fade-up": "fade-up 300ms ease-out 150ms both",
        // Mobile menu handle: a few pulses as a hint, then still (Navigation.tsx);
        // an endless pulse keeps the screen repainting and drains battery.
        "pulse-hint": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 3",
        // Summary page "scroll down" chevron: same idea, a few bounces then still.
        "bounce-hint": "bounce 1s 3",
        "ring-drain": "ring-drain linear forwards",
      },
    },
  },
  plugins: [],
};
