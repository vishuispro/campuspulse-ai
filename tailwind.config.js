/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FA',
        surface: '#FFFFFF',
        ink: {
          primary: '#172B4D',
          secondary: '#667085',
        },
        border: {
          subtle: '#E6EAF0',
        },
        accent: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          subtle: '#F0FDFA',
          border: '#CCFBF1',
        },
        risk: {
          critical: '#DC2626',
          'critical-bg': '#FEF2F2',
          'critical-border': '#FECACA',
          moderate: '#D97706',
          'moderate-bg': '#FFFBEB',
          'moderate-border': '#FDE68A',
          positive: '#15803D',
          'positive-bg': '#F0FDF4',
          'positive-border': '#BBF7D0',
        },
        brand: {
          navy: '#0F2744',
          'navy-dark': '#09182A',
          teal: '#0D9488',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
