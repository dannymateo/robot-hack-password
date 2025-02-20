const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'grid-white': "linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
        'matrix-gradient': "linear-gradient(180deg, rgba(var(--color-primary), 0.15) 0%, rgba(var(--color-primary), 0) 100%)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'matrix-rain': 'matrix 20s linear infinite',
        'glitch': 'glitch 1s linear infinite',
      },
      keyframes: {
        matrix: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translateX(0)' },
          '33%': { transform: 'translateX(2px)' },
          '66%': { transform: 'translateX(-2px)' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
}; 