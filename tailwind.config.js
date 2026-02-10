/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        incidencia: { DEFAULT: '#dc2626', light: '#fef2f2', dark: '#b91c1c' },
        mejora: { DEFAULT: '#2563eb', light: '#eff6ff', dark: '#1d4ed8' },
        proyecto: { DEFAULT: '#16a34a', light: '#f0fdf4', dark: '#15803d' },
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        'on-surface': 'var(--on-surface)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        ring: 'var(--ring)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
