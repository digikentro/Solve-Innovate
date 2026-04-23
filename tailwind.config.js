/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#faf8f5',
        sidebar: '#f5f3ef',
        primary: {
          DEFAULT: '#0f121f',
          foreground: '#ffffff',
        },
      }
    },
  },
  plugins: [],
}
