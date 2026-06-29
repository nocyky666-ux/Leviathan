import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme
        light: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          card: '#F4F4F5',
          border: '#E4E4E7',
        },
        // Dark theme
        dark: {
          bg: '#09090B',
          surface: '#111827',
          card: '#18181B',
          border: '#27272A',
        },
        // Brand
        brand: {
          primary: '#5B5BD6',
          secondary: '#6E6EE8',
          accent: '#7C8CFF',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        hero: ['72px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        section: ['42px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        card: ['22px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #5B5BD6 0%, #7C8CFF 100%)',
        'surface-gradient-light': 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F5 100%)',
        'surface-gradient-dark': 'linear-gradient(135deg, #111827 0%, #18181B 100%)',
        'hero-gradient': 'radial-gradient(ellipse at top, rgba(91,91,214,0.15) 0%, transparent 60%)',
      },
      boxShadow: {
        // Neumorphism light
        'neu-light': '6px 6px 12px #D9D9E0, -6px -6px 12px #FFFFFF',
        'neu-light-inset': 'inset 4px 4px 8px #D9D9E0, inset -4px -4px 8px #FFFFFF',
        // Neumorphism dark
        'neu-dark': '6px 6px 12px rgba(0,0,0,0.4), -6px -6px 12px rgba(255,255,255,0.03)',
        'neu-dark-inset': 'inset 4px 4px 8px rgba(0,0,0,0.4), inset -4px -4px 8px rgba(255,255,255,0.03)',
        // Glassmorphism
        'glass': '0 8px 30px rgba(0,0,0,0.08)',
        'glass-dark': '0 8px 30px rgba(0,0,0,0.3)',
        // Brand glow
        'brand-glow': '0 0 20px rgba(91,91,214,0.3)',
        'brand-glow-lg': '0 0 40px rgba(91,91,214,0.2)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
