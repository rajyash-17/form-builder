/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ink-black': '#0b0b0d',
        'desk-dark': '#15151a',
        'aged-paper': '#e9dfc7',
        'paper-dark': '#cfc3a3',
        'lamp-amber': '#f0b44c',
        'string-red': '#b3261e',
        'fog-grey': '#8a8a92',
        'surface': 'var(--bg-surface)',
        'primary': 'var(--text-primary)',
        'muted': 'var(--text-muted)',
        'border-color': 'var(--border-color)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        typewriter: ['"Special Elite"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'amber-glow': '0 0 15px rgba(240, 180, 76, 0.45)',
        'paper-shadow': '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
