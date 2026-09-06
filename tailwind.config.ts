// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        sidebar: "var(--bg-sidebar)",
        surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)", 3: "var(--surface-3)" },
        line: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        gold: { DEFAULT: "var(--gold)", strong: "var(--gold-strong)", deep: "var(--gold-deep)", soft: "var(--gold-soft)" },
        ink: { DEFAULT: "var(--text)", muted: "var(--text-muted)", faint: "var(--text-faint)" },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
      },
      borderColor: { DEFAULT: "var(--border)" },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: { card: "16px", control: "10px", tile: "12px" },
      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        glow: "0 0 0 1px rgba(201,169,97,0.35), 0 10px 30px rgba(201,169,97,0.10)",
      },
    },
  },
  plugins: [],
}

export default config