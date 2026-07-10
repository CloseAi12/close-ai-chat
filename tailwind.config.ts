import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Close AI design tokens
        canvas: {
          light: "#FAFAF8",
          dark: "#14161C",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1B1E27",
        },
        ink: {
          light: "#1B1D23",
          dark: "#ECEDF3",
        },
        muted: {
          light: "#6B7280",
          dark: "#9AA0B1",
        },
        brand: {
          DEFAULT: "#5B5FEF",
          50: "#EEEEFD",
          100: "#E1E1FC",
          200: "#C6C6FA",
          500: "#5B5FEF",
          600: "#4548D6",
          700: "#3436AD",
        },
        line: {
          light: "#E7E5DF",
          dark: "#2A2D38",
        },
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        chat: "1.15rem",
      },
      keyframes: {
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        orbit: "orbit 1.4s linear infinite",
        fadeIn: "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
