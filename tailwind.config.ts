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
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "spin-slow": "spin 22s linear infinite",
        "spin-reverse": "spin 9s linear infinite reverse",
        float: "float 5s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
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
