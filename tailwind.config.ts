import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./context/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f0f",
        surface: "#181818",
        surface2: "#212121",
        border: "#2a2a2a",
        accent: "#ff453a",
        text: "#f1f1f1",
        subtext: "#a7a7a7",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
