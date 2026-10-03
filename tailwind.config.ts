import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          black: "#000000",
          white: "#FFFFFF",
          yellow: "#FFE600",
          red: "#FF3333",
          green: "#00FF66",
          blue: "#2979FF",
          cyan: "#00E5FF",
          gray: "#E5E5E5",
          darkgray: "#181818",
        },
      },
      boxShadow: {
        brutal: "4px 4px 0px #000000",
        "brutal-sm": "2px 2px 0px #000000",
        "brutal-lg": "6px 6px 0px #000000",
        "brutal-xl": "8px 8px 0px #000000",
        "brutal-white": "4px 4px 0px #FFFFFF",
      },
      borderWidth: {
        "3": "3px",
      },
      fontFamily: {
        mono: ["var(--font-space-mono)", "Courier New", "monospace"],
        sans: ["var(--font-inter)", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
