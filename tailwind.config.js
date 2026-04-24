/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"Noto Sans JP"',
          '"Hiragino Sans"',
          '"Yu Gothic"',
          "system-ui",
          "sans-serif",
        ],
        display: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          '"Noto Sans JP"',
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Signature brand palette — "Aurora" (violet → magenta → cyan)
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        aurora: {
          pink: "#f472b6",
          magenta: "#e879f9",
          violet: "#8b5cf6",
          indigo: "#6366f1",
          sky: "#38bdf8",
          mint: "#34d399",
        },
        // Theme-aware surfaces & ink (driven by CSS variables, see index.css)
        surface: {
          base: "rgb(var(--c-surface-base) / <alpha-value>)",
          raised: "rgb(var(--c-surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--c-surface-overlay) / <alpha-value>)",
          sunken: "rgb(var(--c-surface-sunken) / <alpha-value>)",
        },
        ink: {
          primary: "rgb(var(--c-ink-primary) / <alpha-value>)",
          secondary: "rgb(var(--c-ink-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--c-ink-tertiary) / <alpha-value>)",
          inverse: "rgb(var(--c-ink-inverse) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--c-line) / <alpha-value>)",
          strong: "rgb(var(--c-line-strong) / <alpha-value>)",
        },
      },
      boxShadow: {
        glow: "0 10px 30px -10px rgba(124, 58, 237, 0.45)",
        card: "0 20px 45px -20px rgba(15, 23, 42, 0.25)",
        "card-dark": "0 20px 45px -20px rgba(0, 0, 0, 0.6)",
        aurora:
          "0 12px 36px -12px rgba(236, 72, 153, 0.35), 0 12px 36px -18px rgba(124, 58, 237, 0.45)",
      },
      backgroundImage: {
        "aurora-r":
          "linear-gradient(120deg, #ec4899 0%, #a855f7 35%, #6366f1 65%, #14b8a6 100%)",
        "aurora-b":
          "linear-gradient(135deg, #f472b6 0%, #a78bfa 35%, #60a5fa 70%, #34d399 100%)",
        "aurora-tile":
          "conic-gradient(from 220deg at 30% 30%, #f472b6, #a78bfa, #60a5fa, #34d399, #fbbf24, #f472b6)",
      },
      animation: {
        "gradient-x": "gradient-x 12s ease infinite",
        "float-slow": "float 9s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "fade-in": "fade-in 250ms ease-out both",
        "slide-up": "slide-up 320ms cubic-bezier(.2,.8,.2,1) both",
        "pop-in": "pop-in 260ms cubic-bezier(.2,.8,.2,1) both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%,100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-16px) rotate(3deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".6" },
        },
      },
    },
  },
  plugins: [],
};
