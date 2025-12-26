/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',     // H2H primary (คลาสสิก v0.1.7)
          blueDark: '#1E40AF', // hover/focus
          gold: '#D4AF37',     // accent
          ink:  '#0f172a',     // text
        },
      },
      boxShadow: {
        silk:  '0 1px 1px rgba(16,24,40,.04), 0 4px 12px rgba(16,24,40,.06)',
        silkLg:'0 2px 6px rgba(16,24,40,.06), 0 12px 24px rgba(16,24,40,.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
