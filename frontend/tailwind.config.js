/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // CSS variable–based so all three themes can override the accent color.
          // The "<alpha-value>" placeholder enables Tailwind opacity modifiers
          // like bg-brand-500/10 → rgb(var(--brand-500) / 0.1)
          50:  "rgb(var(--brand-50)  / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          900: "#1e3a8a",  // static deep blue for very rare use
        },
        surface: {
          DEFAULT: "rgb(var(--surface)        / <alpha-value>)",
          card:    "rgb(var(--surface-card)   / <alpha-value>)",
          border:  "rgb(var(--surface-border) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "price-up":   "priceUp   0.5s ease-out",
        "price-down": "priceDown 0.5s ease-out",
      },
      keyframes: {
        priceUp:   { "0%": { backgroundColor: "rgb(34 197 94 / 0.3)"  }, "100%": { backgroundColor: "transparent" } },
        priceDown: { "0%": { backgroundColor: "rgb(239 68 68 / 0.3)"  }, "100%": { backgroundColor: "transparent" } },
      },
    },
  },
  plugins: [],
};
