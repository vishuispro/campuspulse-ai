/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F2744',
          'navy-dark': '#09182A',
          'navy-light': '#1E3A5F',
          teal: '#0D9488',
          'teal-light': '#CCFBF1',
          'teal-dark': '#0F766E',
        },
        risk: {
          critical: '#DC2626',
          'critical-bg': '#FEF2F2',
          high: '#EA580C',
          'high-bg': '#FFF7ED',
          moderate: '#D97706',
          'moderate-bg': '#FFFBEB',
          low: '#059669',
          'low-bg': '#ECFDF5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
