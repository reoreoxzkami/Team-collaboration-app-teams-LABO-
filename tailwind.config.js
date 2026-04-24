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
        // Signature brand palette — LABO Purple. A richer, cooler violet with
        // a slightly blue tail that reads as distinctively "ours" rather than
        // Tailwind-default violet.
        brand: {
          50: "#f4f1ff",
          100: "#e8e2ff",
          200: "#d2c5ff",
          300: "#b39dff",
          400: "#9373ff",
          500: "#7a4dff", // hero
          600: "#6932f0",
          700: "#5722c9",
          800: "#461ba0",
          900: "#351472",
        },
        // Signature accent — electric coral / lab pink, used sparingly as
        // "signature moments" (CTA glow, focus ring, hero accents).
        signal: {
          50: "#fff1f4",
          100: "#ffe2e9",
          200: "#ffc2d0",
          300: "#ff94ac",
          400: "#ff5f85",
          500: "#ff2f64", // hero
          600: "#e3154b",
          700: "#bb0a3c",
          800: "#8d0832",
          900: "#660628",
        },
        aurora: {
          pink: "#ff5fa2",
          magenta: "#c96bff",
          violet: "#7a4dff",
          indigo: "#4b5dff",
          sky: "#00d4ff",
          mint: "#2df0b1",
          sun: "#ffc24b",
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
        glow: "0 14px 40px -10px rgba(122, 77, 255, 0.55)",
        card: "0 20px 45px -20px rgba(15, 23, 42, 0.25)",
        "card-dark": "0 20px 45px -20px rgba(0, 0, 0, 0.6)",
        aurora:
          "0 14px 40px -14px rgba(255, 47, 100, 0.35), 0 14px 40px -16px rgba(122, 77, 255, 0.55)",
        // Signature CTA shadow — subtle tri-tone glow that reads as "LABO".
        signature:
          "0 8px 24px -10px rgba(122, 77, 255, 0.55), 0 18px 40px -18px rgba(255, 47, 100, 0.35), inset 0 1px 0 rgba(255,255,255,.25)",
      },
      backgroundImage: {
        "aurora-r":
          "linear-gradient(120deg, #ff2f64 0%, #c96bff 35%, #7a4dff 65%, #00d4ff 100%)",
        "aurora-b":
          "linear-gradient(135deg, #ff5fa2 0%, #9373ff 35%, #4b5dff 70%, #2df0b1 100%)",
        "aurora-tile":
          "conic-gradient(from 220deg at 30% 30%, #ff5fa2, #9373ff, #4b5dff, #2df0b1, #ffc24b, #ff5fa2)",
        // Tight grain used as a subtle overlay on large surfaces to give the
        // UI a tactile, premium, "not-a-default-gradient" feel.
        grain:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      animation: {
        "gradient-x": "gradient-x 12s ease infinite",
        "float-slow": "float 9s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "fade-in": "fade-in 250ms ease-out both",
        "slide-up": "slide-up 320ms cubic-bezier(.2,.8,.2,1) both",
        "pop-in": "pop-in 260ms cubic-bezier(.2,.8,.2,1) both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "aurora-drift": "aurora-drift 28s ease-in-out infinite",
        "logo-spin": "logo-spin 18s linear infinite",
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
        "aurora-drift": {
          "0%,100%": { transform: "translate3d(-4%, -2%, 0) rotate(0deg)" },
          "50%": { transform: "translate3d(4%, 2%, 0) rotate(8deg)" },
        },
        "logo-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
