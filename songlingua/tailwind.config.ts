import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1ed760",
          dark: "#169c46",
        },
        surface: {
          DEFAULT: "#121218",
          card: "#1a1a23",
          border: "#2a2a35",
        },
      },
    },
  },
  plugins: [],
};

export default config;
