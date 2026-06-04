import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  safelist: [
    { pattern: /^(bg|text|border|ring|from|to|via|fill|stroke)-brand-/ },
    { pattern: /^(bg|text|border|ring|from|to|via|fill|stroke)-brand-/, variants: ['dark', 'hover', 'focus', 'active'] },
  ],
  theme: {
    extend: {
      colors: {
        // Angaza blue-teal brand palette
        brand: {
          50:  '#E0F5FA',
          100: '#B3E5F2',
          200: '#80D4E9',
          300: '#4DC3E0',
          400: '#26B6DA',
          500: '#00A9D3',
          600: '#0090B8',  // primary buttons
          700: '#0077A0',  // sidebar bg, hover
          800: '#005B7D',
          900: '#003C54',
          950: '#002235',
        },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
};

export default config;
