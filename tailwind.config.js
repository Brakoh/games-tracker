/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0C0B08",
        paper: "#F5F2E3",
        card: "#FFFFFF",
      },
      fontFamily: {
        display: ["Anton_400Regular"],
      },
    },
  },
  plugins: [],
};
