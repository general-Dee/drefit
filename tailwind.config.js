/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        drefit: {
          dark: "#0D0DDD",
          lime: "#C8F135",
          white: "#FFFFFF",
          charcoal: "#E1E1E1",
          "dark-secondary": "#1A1A2E",
        },
      },
      fontFamily: {
        heading: ["Bebas Neue", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      backgroundImage: {
        "mesh-gradient": "linear-gradient(135deg, #0D0DDD 0%, #1A1A2E 50%, #C8F135 100%)",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out",
        "glow-pulse": "glow-pulse 2s infinite",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 0 20px rgba(200,241,53,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(200,241,53,0.6)" },
        },
      },
    },
  },
  plugins: [],
}
