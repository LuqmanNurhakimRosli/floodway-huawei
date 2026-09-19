/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        geo: {
          canvas: 'var(--geo-canvas)',
          panel: 'var(--geo-panel)',
          'panel-header': 'var(--geo-panel-header)',
          'surface-1': 'var(--geo-surface-1)',
          'surface-2': 'var(--geo-surface-2)',
          'surface-3': 'var(--geo-surface-3)',
          border: 'var(--geo-border)',
          'border-strong': 'var(--geo-border-strong)',
          'border-accent': 'var(--geo-border-accent)',
          divider: 'var(--geo-divider)',
          'text-primary': 'var(--geo-text-primary)',
          'text-secondary': 'var(--geo-text-secondary)',
          'text-tertiary': 'var(--geo-text-tertiary)',
          'text-quaternary': 'var(--geo-text-quaternary)',
          accent: 'var(--geo-accent)',
          'accent-hover': 'var(--geo-accent-hover)',
          'accent-muted': 'var(--geo-accent-muted)',
          'accent-glow': 'var(--geo-accent-glow)',
          critical: 'var(--geo-critical)',
          'critical-bg': 'var(--geo-critical-bg)',
          warning: 'var(--geo-warning)',
          'warning-bg': 'var(--geo-warning-bg)',
          caution: 'var(--geo-caution)',
          success: 'var(--geo-success)',
          'success-bg': 'var(--geo-success-bg)',
          info: 'var(--geo-info)',
        },
        // Backwards-compatible aliases mapping to CSS variables
        eoc: {
          bg: 'var(--geo-canvas)',
          panel: 'var(--geo-panel)',
          panelSubtle: 'var(--geo-surface-1)',
          border: 'var(--geo-border)',
          borderLight: 'var(--geo-border-strong)',
          text: 'var(--geo-text-primary)',
          muted: 'var(--geo-text-secondary)',
          dim: 'var(--geo-text-tertiary)',
          accent: 'var(--geo-accent)',
          accentDark: 'var(--geo-accent-hover)',
          danger: 'var(--geo-critical)',
          warning: 'var(--geo-warning)',
          caution: 'var(--geo-caution)',
          success: 'var(--geo-success)',
          water: 'var(--geo-accent)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle-header': '0 1px 3px rgba(0, 0, 0, 0.25)',
        'tactical': '0 8px 32px 0 rgba(0, 0, 0, 0.35), 0 0 1px 1px var(--geo-border)',
        'glow-cyan': '0 0 16px var(--geo-accent-glow)',
        'glass-card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'modal': '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 1px var(--geo-border-accent)',
      },
      transitionTimingFunction: {
        'tactical': 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    },
  },
  plugins: [],
}
