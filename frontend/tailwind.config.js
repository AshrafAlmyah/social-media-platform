/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      // Override Tailwind default sans stack with project body typography
      sans: ['General Sans', 'Inter', 'system-ui', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F1F1F',
          50: '#f7f6f4',
          100: '#eceae7',
          200: '#d9d4ce',
          300: '#b8afa5',
          400: '#91857a',
          500: '#6b6b6b',
          600: '#595149',
          700: '#433d37',
          800: '#2f2b27',
          900: '#1f1f1f',
        },
        surface: {
          canvas: '#F8F7F4',
          DEFAULT: '#FFFFFF',
          soft: '#EFEDE8',
          border: '#E5E2DC',
          raised: '#FCFBF8',
        },
        accent: {
          DEFAULT: '#E07A5F',
          soft: '#F2DDD6',
          hover: '#CF6F56',
          50: '#fdf2ef',
          100: '#f9e1db',
          200: '#f2c2b5',
          300: '#ea9f8a',
          400: '#e58669',
          500: '#e07a5f',
          600: '#cf6f56',
          700: '#b85f49',
          800: '#964d3b',
          900: '#7a4031',
        },
        secondary: {
          DEFAULT: '#3D5A80',
          soft: '#DCE4EF',
          hover: '#334D6E',
          400: '#6f89aa',
          500: '#3d5a80',
          600: '#334d6e',
        },

        // Legacy aliases kept for compatibility with existing utility classes
        coral: {
          400: '#e58669',
          500: '#e07a5f',
          600: '#cf6f56',
        },
        mint: {
          400: '#6f89aa',
          500: '#3d5a80',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['General Sans', 'Inter', 'system-ui', 'sans-serif'],
        meta: ['General Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['General Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['2.5rem', { lineHeight: '1.2', letterSpacing: '0.01em', fontWeight: '600' }],
        h2: ['2rem', { lineHeight: '1.24', letterSpacing: '0.01em', fontWeight: '600' }],
        h3: ['1.5rem', { lineHeight: '1.28', letterSpacing: '0.008em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.68', fontWeight: '400' }],
        body: ['1rem', { lineHeight: '1.65', fontWeight: '400' }],
        meta: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.02em', fontWeight: '500' }],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

















