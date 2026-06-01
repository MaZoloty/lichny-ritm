import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Базовая палитра «Личный ритм» — мягкая, светлая, пастельная
        bg: "#FAF7F2",
        card: "#FFFFFF",
        ink: "#2F2F35",
        muted: "#7B7B86",
        accent: "#8B5CF6",
        green: "#A7D8A0",
        peach: "#F29B8F",
        line: "#EEE8E0",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(47, 47, 53, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
