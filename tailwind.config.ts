import type { Config } from "tailwindcss";

// Paleta y tokens de diseño de Monte Pilates.
// Tomada del Instagram real del estudio (@monte.pilates).
// Este archivo es la ÚNICA fuente de verdad para colores, tipografías
// y animaciones: si hay que ajustar un tono o una fuente, se cambia
// acá y se propaga a todo el proyecto.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F3E9DB",
        card: "#FFFBF4",
        ink: {
          DEFAULT: "#3C2A20",
          soft: "#8C7A6B",
        },
        line: "#E6D8C4",
        moss: {
          DEFAULT: "#6E4A38",
          dark: "#4E3325",
          soft: "#EDE0D0",
        },
        clay: {
          DEFAULT: "#C43E8E",
          dark: "#9C2E6E",
          soft: "#FAE1EF",
        },
        danger: {
          DEFAULT: "#B5453A",
          soft: "#F6E2DE",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Inter", "ui-serif", "serif"],
      },
      borderRadius: {
        md2: "10px",
        lg2: "12px",
        xl2: "14px",
        "2xl2": "16px",
      },
      keyframes: {
        "gentle-float": {
          "0%, 100%": { transform: "translateY(2px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "wa-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(37, 211, 102, 0.5)" },
          "70%": { boxShadow: "0 0 0 16px rgba(37, 211, 102, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(37, 211, 102, 0)" },
        },
      },
      animation: {
        float: "gentle-float 3.5s ease-in-out infinite",
        "wa-pulse": "wa-pulse 2.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
