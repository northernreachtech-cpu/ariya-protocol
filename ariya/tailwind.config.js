/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'livvic': ['Livvic', 'sans-serif'],
      },
      colors: {
        primary: '#264653', // Indigo Dye
        secondary: '#C48E88', // Ash Rose
        success: '#CAD2C5', // Matcha
        accent: '#F4A896', // Dusty Peach
        background: {
          light: '#FAFAFA',
          dark: '#1C1C1C',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#2A2A2A',
        },
        text: {
          light: '#1C1C1C',
          dark: '#EAEAEA',
        },
        muted: {
          light: '#6E6E6E',
          dark: '#B3B3B3',
        },
        border: {
          light: '#E0E0E0',
          dark: '#3B3B3B',
        },
        // Theme-aware CSS variables
        'background': 'hsl(var(--background))',
        'background-secondary': 'hsl(var(--background-secondary))',
        'foreground': 'hsl(var(--foreground))',
        'foreground-secondary': 'hsl(var(--foreground-secondary))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'border': 'hsl(var(--border))',
        'border-secondary': 'hsl(var(--border-secondary))',
        'card': 'hsl(var(--card))',
        'card-secondary': 'hsl(var(--card-secondary))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'swim': 'swim 8s ease-in-out infinite',
        'orbit': 'orbit 12s linear infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'cardFloat': 'cardFloat 0.3s ease-out',
        'iconSpin': 'iconSpin 0.5s ease-out',
        'glowPulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        swim: {
          '0%, 100%': { transform: 'translateX(0px) translateY(0px)' },
          '25%': { transform: 'translateX(10px) translateY(-10px)' },
          '50%': { transform: 'translateX(0px) translateY(-20px)' },
          '75%': { transform: 'translateX(-10px) translateY(-10px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(20px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(20px) rotate(-360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(37, 99, 235, 0.6)' },
        },
        cardFloat: {
          '0%': { transform: 'translateY(0px) scale(1)' },
          '100%': { transform: 'translateY(-8px) scale(1.02)' },
        },
        iconSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glowPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(37, 99, 235, 0.2)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)',
            transform: 'scale(1.05)'
          },
        },
      },
    },
  },
  plugins: [],
}
