/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        petrol: { 950: '#0A2A33', 900: '#0F3B46', 800: '#14505E', 700: '#1B6577', 300: '#9FB6BD' },
        cobalt: { 50: '#EEF2FF', 100: '#DCE4FF', 500: '#3B5CF0', 600: '#2F4BD8', 700: '#263CAF' },
        pulse: { 50: '#FFF0F3', 100: '#FFD9E1', 500: '#F0436B', 600: '#D6335A' },
        mint: { 50: '#E7F8F2', 600: '#128A68' },
        mist: { 50: '#F6F8FB', 100: '#EEF2F6', 200: '#E1E7EE', 300: '#CBD5E1' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,59,70,.06), 0 1px 1px rgba(15,59,70,.04)',
        pop: '0 12px 32px -8px rgba(10,42,51,.28)',
      },
      keyframes: {
        pop: { from: { opacity: 0, transform: 'translateY(8px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        draw: { from: { strokeDashoffset: 600 }, to: { strokeDashoffset: 0 } },
      },
      animation: { pop: 'pop .18s ease-out', draw: 'draw 1.6s ease-out forwards' },
    },
  },
  plugins: [],
};
