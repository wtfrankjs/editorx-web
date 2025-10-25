/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#ffffff',
          surface: '#f8f9fa',
          border: '#e0e0e0',
        },
        dark: {
          bg: '#0C0C0F',
          surface: '#1A1A22',
          border: '#2a2a35',
        }
      }
    },
  },
  plugins: [],
};
