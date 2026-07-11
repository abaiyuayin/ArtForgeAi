/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 使用 CSS 变量实现主题切换，变量定义在 style.css 中
        'af-bg': 'var(--af-bg)',
        'af-surface': 'var(--af-surface)',
        'af-surface-hover': 'var(--af-surface-hover)',
        'af-ink': 'var(--af-ink)',
        'af-muted': 'var(--af-muted)',
        'af-rule': 'var(--af-rule)',
        'af-accent': 'var(--af-accent)',
        'af-accent-soft': 'var(--af-accent-soft)',
        'af-accent2': 'var(--af-accent2)',
        'af-danger': 'var(--af-danger)',
        'af-warning': 'var(--af-warning)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
