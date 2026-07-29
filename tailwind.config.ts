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
        sand: "#F6F1E8",
        clay: "#D97A54",
        olive: "#355548",
        ink: "#1E252B",
        mist: "#EEF2EE",
      },
      boxShadow: {
        card: "0 18px 40px rgba(30, 37, 43, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
