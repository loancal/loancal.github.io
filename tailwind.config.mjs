/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        palette: {
          slate: '#B7C4CF',
          cream: '#EEE3CB',
          sand: '#D7C0AE',
          mocha: '#967E76',
        },
        theme: {
          bg: 'var(--color-bg)',
          card: 'var(--color-card)',
          cardHover: 'var(--color-card-hover)',
          border: 'var(--color-border)',
          borderSubtle: 'var(--color-border-subtle)',
          text: 'var(--color-text)',
          textMuted: 'var(--color-text-muted)',
          accent: 'var(--color-accent)',
          accentHover: 'var(--color-accent-hover)',
          accentText: 'var(--color-accent-text)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(150, 126, 118, 0.12)',
        'soft-lg': '0 10px 30px -4px rgba(150, 126, 118, 0.18)',
        'soft-dark': '0 4px 25px -2px rgba(0, 0, 0, 0.35)',
        'soft-dark-lg': '0 10px 35px -4px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
