/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        "bg-dark": "hsl(var(--bg-dark) / <alpha-value>)",
        bg: "hsl(var(--bg) / <alpha-value>)",
        "bg-light": "hsl(var(--bg-light) / <alpha-value>)",

        text: "hsl(var(--text) / <alpha-value>)",
        "text-muted": "hsl(var(--text-muted) / <alpha-value>)",

        border: "hsl(var(--border) / <alpha-value>)",
        highlight: "hsl(var(--highlight) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
