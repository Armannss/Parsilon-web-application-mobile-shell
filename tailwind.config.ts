import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Parsilon navy, taken from the logo.
        brand: {
          50: "#EEF3FB",
          100: "#D9E4F5",
          200: "#B3C8EA",
          300: "#86A6DB",
          400: "#5580C8",
          500: "#2F5FB3",
          600: "#1F4C9C",
          700: "#17479E",
          800: "#123A80",
          900: "#0E2F6D",
        },
        // Parsilon green accent.
        accent: {
          400: "#A3D45F",
          500: "#8CC63F",
          600: "#73A830",
        },
      },
      boxShadow: {
        card: "0 6px 20px rgba(14, 47, 109, 0.05)",
        float: "0 12px 32px rgba(14, 47, 109, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
