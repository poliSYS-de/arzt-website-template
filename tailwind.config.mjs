/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'accent': '#2B6CB0',
        'accent-dark': '#1E5090',
        'dark': '#1A1A1A',
        'gray-text': '#2D3748',
        'gray-muted': '#718096',
        'gray-light': '#F7FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'widest': '0.15em',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
