/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./assets/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        'bg': '#000000',
        'surface': '#0f0f0f',
        'border': '#1f1f1f',
        'text-main': '#ffffff',
        'text-muted': '#a0a0a0',
        'accent': '#ffffff',
        // Admin panel extras
        'bg-main': '#000000',
        'surface-dark': '#0f0f0f',
        'card-glass': 'rgba(255, 255, 255, 0.02)',
        'border-glass': '#1f1f1f',
        'accent-dim': '#a0a0a0',
        'success': '#10b981',
        'danger': '#ef4444',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
