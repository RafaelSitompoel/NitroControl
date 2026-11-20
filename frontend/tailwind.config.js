/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nitro: {
          bg: '#0a0b0e',
          card: '#12141a',
          cardHover: '#181b24',
          border: '#232734',
          borderLight: '#2f3445',
          red: '#ff2e3b',
          redDark: '#c91420',
          redLight: '#ff5c66',
          text: '#f3f4f6',
          muted: '#8b92a5',
        },
      },
      boxShadow: {
        'nitro-glow': '0 0 20px -3px rgba(255, 46, 59, 0.25)',
        'nitro-glow-lg': '0 0 35px -5px rgba(255, 46, 59, 0.4)',
      },
    },
  },
  plugins: [],
}
