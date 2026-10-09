import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#060807",
        surface: "#0c100d",
        raised: "#131913",
        line: "#222b23",
        muted: "#7d8b7f",
        body: "#c3cdc4",
        ink: "#e6f6dc",
        accent: { DEFAULT: "#a6ff3d", soft: "rgba(166,255,61,0.14)", ink: "#081204" },
        ok: "#6fd3a8",
        bad: "#ff6474",
        mint: "#6fd3a8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { xl: "14px", "2xl": "18px" },
      keyframes: {
        flash: { "0%": { color: "#a6ff3d" }, "100%": { color: "inherit" } },
        slidein: { "0%": { opacity: "0", transform: "translateY(-6px)" }, "100%": { opacity: "1", transform: "none" } },
        ticker: { to: { transform: "translateX(-50%)" } },
      },
      animation: {
        flash: "flash 1.2s ease-out",
        slidein: "slidein .4s ease-out",
        ticker: "ticker 38s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
