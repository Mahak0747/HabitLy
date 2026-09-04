/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f2f1fe",
          100: "#e6e4fd",
          200: "#cdc8fb",
          300: "#b3aefa",
          400: "#8f87f5",
          500: "#6C63F2",
          600: "#5850d6",
          700: "#453fab",
          800: "#332f80",
          900: "#211f55",
        },
        ink: {
          50: "#f7f7fb",
          100: "#eceaf5",
          800: "#161327",
          900: "#0d0b18",
          950: "#08070f",
        },
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(76, 65, 180, 0.25)",
        card: "0 1px 2px rgba(16,12,40,0.04), 0 8px 24px -8px rgba(16,12,40,0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
