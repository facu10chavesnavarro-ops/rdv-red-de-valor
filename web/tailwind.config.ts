import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E11",
        surface: "#12161C",
        raised: "#181D25",
        line: "#242B35",
        muted: "#8A94A6",
        ink: "#E6E8EB",
        accent: { DEFAULT: "#F3BA2F", soft: "rgba(243,186,47,0.12)" },
        ok: "#3FB68B",
        bad: "#F6465D",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        flash: { "0%": { color: "#F3BA2F" }, "100%": { color: "inherit" } },
        slidein: { "0%": { opacity: "0", transform: "translateY(-6px)" }, "100%": { opacity: "1", transform: "none" } },
      },
      animation: { flash: "flash 1.2s ease-out", slidein: "slidein .4s ease-out" },
    },
  },
  plugins: [],
};
export default config;
