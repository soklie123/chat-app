/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0F14", // app background
          raised: "#12171D", // panels / sidebar
          surface: "#171D24", // cards, inputs
          border: "#232B33",
        },
        bubble: {
          sent: "#1F4B5C", // deep teal-indigo, sent message fill
          sentHover: "#26586B",
          received: "#1C232B", // warm-neutral dark gray, received fill
        },
        accent: {
          DEFAULT: "#5B8DEF", // primary actions, links, focus rings
          hover: "#4A7BDB",
          muted: "#5B8DEF20",
        },
        presence: {
          online: "#3DDC97",
          away: "#E8B339",
        },
        danger: "#E55A5A",
        ink: {
          DEFAULT: "#E7ECF1", // primary text
          muted: "#8B97A3", // secondary text
          faint: "#5C6671", // timestamps, hints
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        bubble: "1.1rem",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset",
        floating: "0 8px 30px rgba(0,0,0,0.35)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(61,220,151,0.55)" },
          "50%": { boxShadow: "0 0 0 4px rgba(61,220,151,0)" },
        },
        wave: {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-3px)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        breathe: "breathe 2.4s ease-in-out infinite",
        wave: "wave 1.2s ease-in-out infinite",
        slideUp: "slideUp 0.18s ease-out",
        popIn: "popIn 0.12s ease-out",
      },
    },
  },
  plugins: [],
};