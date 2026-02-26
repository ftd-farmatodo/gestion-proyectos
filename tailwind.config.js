/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary:       { DEFAULT: 'var(--primary)', light: 'var(--primary-light)' },
        accent:        { DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)' },
        surface:       { DEFAULT: 'var(--surface)', alt: 'var(--surface-alt)', card: 'var(--surface-card)' },
        'on-surface':  'var(--on-surface)',
        muted:         'var(--muted)',
        border:        'var(--border)',
        ring:          'var(--ring)',
        magenta:       { DEFAULT: 'var(--magenta)' },
        purple:        { DEFAULT: 'var(--purple)' },
        orange:        { DEFAULT: 'var(--orange)' },
        lime:          { DEFAULT: 'var(--lime)' },
        'cool-gray':   { DEFAULT: 'var(--cool-gray)' },
        // Request type colors mapped to Pantone
        incidencia:    { DEFAULT: 'var(--magenta)',  light: '#CC2D7F15', dark: '#E85DA820' },
        mejora:        { DEFAULT: 'var(--primary-light)', light: '#0077C815', dark: '#6AADFF20' },
        proyecto:      { DEFAULT: 'var(--lime)',     light: '#8DC63F15', dark: '#A8D95E20' },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      animation: {
        'fade-in':        'fade-in 0.3s ease-out',
        'slide-up':       'slide-up 0.35s ease-out',
        'slide-up-sm':    'slide-up-sm 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in':       'scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'float-orb-1':    'float-orb-1 18s ease-in-out infinite',
        'float-orb-2':    'float-orb-2 22s ease-in-out infinite',
        'float-orb-3':    'float-orb-3 26s ease-in-out infinite',
        'shimmer':        'shimmer 2.5s ease-in-out infinite',
        'stagger-1':      'slide-up-sm 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both',
        'stagger-2':      'slide-up-sm 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both',
        'stagger-3':      'slide-up-sm 0.5s cubic-bezier(0.22,1,0.36,1) 0.3s both',
        'stagger-4':      'slide-up-sm 0.5s cubic-bezier(0.22,1,0.36,1) 0.4s both',
        'stagger-5':      'slide-up-sm 0.5s cubic-bezier(0.22,1,0.36,1) 0.5s both',
        'stagger-6':      'slide-up-sm 0.5s cubic-bezier(0.22,1,0.36,1) 0.65s both',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-sm': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'float-orb-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(60px, -40px) scale(1.05)' },
          '66%':      { transform: 'translate(-30px, 30px) scale(0.95)' },
        },
        'float-orb-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(-50px, 50px) scale(1.08)' },
          '66%':      { transform: 'translate(40px, -20px) scale(0.92)' },
        },
        'float-orb-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(30px, 60px) scale(0.96)' },
          '66%':      { transform: 'translate(-60px, -30px) scale(1.04)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
