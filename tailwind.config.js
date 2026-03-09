/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          muted: "#64748b",
        },
        primary: "#3b82f6",
      },
    },
  },
  plugins: [],
};
