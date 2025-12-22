import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium Color Palette
        primary: {
          50: '#fef7ec',
          100: '#fceacc',
          200: '#f9d394',
          300: '#f5b54c',
          400: '#f29d24',
          500: '#e67e0b',
          600: '#cb5e06',
          700: '#a84209',
          800: '#89350f',
          900: '#712e10',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        book: {
          cover: '#5D4037',
          coverLight: '#8D6E63',
          coverDark: '#3E2723',
          page: '#FFFEF7',
          pageShadow: '#F5F0E6',
          spine: '#4E342E',
          gold: '#D4AF37',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'page-turn': 'pageTurn 0.6s ease-in-out',
        'page-turn-back': 'pageTurnBack 0.6s ease-in-out',
        'zoom-in': 'zoomIn 0.3s ease-out',
        'zoom-out': 'zoomOut 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pageTurn: {
          '0%': { transform: 'rotateY(0deg)', transformOrigin: 'left center' },
          '100%': { transform: 'rotateY(-180deg)', transformOrigin: 'left center' },
        },
        pageTurnBack: {
          '0%': { transform: 'rotateY(-180deg)', transformOrigin: 'left center' },
          '100%': { transform: 'rotateY(0deg)', transformOrigin: 'left center' },
        },
        zoomIn: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.5)' },
        },
        zoomOut: {
          '0%': { transform: 'scale(1.5)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'book': '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 0, 0, 0.1)',
        'book-hover': '0 15px 50px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 0, 0, 0.2)',
        'page': '2px 0 5px rgba(0, 0, 0, 0.1)',
      },
      perspective: {
        '1000': '1000px',
        '2000': '2000px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
      backfaceVisibility: {
        'hidden': 'hidden',
      },
    },
  },
  plugins: [],
};

export default config;
