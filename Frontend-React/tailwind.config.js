/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        fadeIn: "fadeIn 200ms ease-out",
        scaleIn: "scaleIn 200ms ease-out",
        lift: "lift 200ms ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        scaleIn: {
          from: { opacity: 0, transform: "scale(0.96)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        lift: {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-2px)" },
        },
      },
    },
  },
  plugins: [],
};
