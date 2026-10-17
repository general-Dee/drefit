/** @type {import('tailwindcss').Config} */
// Design tokens: near-black layered surfaces + one accent (volt lime).
// Contrast on the base background (#0A0A0B): ink 18.1:1, muted 7.7:1,
// subtle 5.9:1, accent 15.2:1; accent-ink on accent 15.2:1 (all WCAG AA+).
// gray-600 (3.7:1) is for borders/decoration only, never body text.
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        drefit: {
          // legacy names kept so existing markup picks up the new theme
          dark: "#0A0A0B",
          lime: "#C8F135",
          white: "#F5F5F4",
          charcoal: "#E4E4E7",
          "dark-secondary": "#111113",
        },
        surface: {
          0: "#0A0A0B",
          1: "#111113",
          2: "#18181B",
          3: "#222226",
        },
        ink: { DEFAULT: "#F5F5F4", muted: "#A1A1AA", subtle: "#8B8B94" },
        accent: { DEFAULT: "#C8F135", hover: "#D6F95E", ink: "#0A0A0B", soft: "rgba(200,241,53,0.12)" },
        // Lifted greys so small text stays AA on near-black.
        gray: {
          50: "#FAFAFA", 100: "#F4F4F5", 200: "#E4E4E7", 300: "#D4D4D8", 400: "#A1A1AA",
          500: "#8B8B94", 600: "#6B6B73", 700: "#3F3F46", 800: "#27272A", 900: "#18181B", 950: "#0A0A0B",
        },
      },
      fontFamily: {
        heading: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // tight type scale (1.25 ratio) with matched line heights
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.55rem" }],
        lg: ["1.125rem", { lineHeight: "1.65rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5625rem", { lineHeight: "2rem", letterSpacing: "-0.01em" }],
        "3xl": ["1.953rem", { lineHeight: "2.3rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.441rem", { lineHeight: "2.7rem", letterSpacing: "-0.025em" }],
        "5xl": ["3.052rem", { lineHeight: "3.2rem", letterSpacing: "-0.03em" }],
        "6xl": ["3.815rem", { lineHeight: "3.9rem", letterSpacing: "-0.035em" }],
        "7xl": ["4.768rem", { lineHeight: "4.8rem", letterSpacing: "-0.04em" }],
        "8xl": ["5.96rem", { lineHeight: "5.9rem", letterSpacing: "-0.045em" }],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        glow: "0 0 0 1px rgba(200,241,53,0.35), 0 8px 32px -8px rgba(200,241,53,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 20px 40px -24px rgba(0,0,0,0.8)",
      },
      transitionTimingFunction: { spring: "cubic-bezier(0.22, 1, 0.36, 1)" },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        "pop-in": "pop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        "glow-pulse": { "0%,100%": { opacity: "0.55" }, "50%": { opacity: "1" } },
        "pop-in": { "0%": { opacity: "0", transform: "scale(0.92)" }, "100%": { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
}
