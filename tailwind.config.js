/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ambiental: {
          DEFAULT: '#2ECC71',
          light: '#58D68D',
          dark: '#27AE60',
        },
        parking: {
          DEFAULT: '#3498DB',
          light: '#5DADE2',
          dark: '#2E86C1',
        },
        facilities: {
          DEFAULT: '#E74C3C',
          light: '#EC7063',
          dark: '#C0392B',
        },
        tecnologia: {
          DEFAULT: '#9B59B6',
          light: '#AF7AC5',
          dark: '#7D3C98',
        },
        seguranca: {
          DEFAULT: '#F1C40F',
          light: '#F4D03F',
          dark: '#D4AC0D',
        },
        brand: {
          dark: '#1F2937',
          graphite: '#374151',
          gray: '#6B7280',
          light: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2ws': '0.5rem',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.gradient-2ws': {
          background:
            'linear-gradient(90deg, #2ECC71 0%, #3498DB 25%, #E74C3C 50%, #9B59B6 75%, #F1C40F 100%)',
        },
        '.gradient-ambiental': {
          background: 'linear-gradient(135deg, #2ECC71 0%, #3498DB 100%)',
        },
        '.gradient-parking': {
          background: 'linear-gradient(135deg, #3498DB 0%, #2ECC71 50%, #E74C3C 100%)',
        },
        '.gradient-facilities': {
          background: 'linear-gradient(135deg, #E74C3C 0%, #9B59B6 100%)',
        },
        '.gradient-tecnologia': {
          background: 'linear-gradient(135deg, #9B59B6 0%, #3498DB 50%, #F1C40F 100%)',
        },
        '.gradient-seguranca': {
          background: 'linear-gradient(135deg, #F1C40F 0%, #E74C3C 50%, #9B59B6 100%)',
        },
      });
    },
  ],
};
