/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        brand: {
          violet: '#7c3aed',
          indigo: '#6366f1',
          fuchsia: '#d946ef',
          pink: '#ec4899',
          rose: '#f43f5e',
          cyan: '#06b6d4',
          coral: '#fb7185',
        },
        status: {
          safe: '#10b981',
          pending: '#f59e0b',
          sighted: '#3b82f6',
          reported: '#64748b',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'clay': '0 16px 36px -4px rgba(124, 58, 237, 0.16), 0 4px 12px -2px rgba(124, 58, 237, 0.08), inset 0 2px 2px 0 rgba(255, 255, 255, 0.8)',
        'clay-pink': '0 16px 36px -4px rgba(236, 72, 153, 0.22), 0 4px 12px -2px rgba(236, 72, 153, 0.10), inset 0 2px 2px 0 rgba(255, 255, 255, 0.8)',
        'clay-sm': '0 6px 16px -2px rgba(124, 58, 237, 0.12), inset 0 1px 2px 0 rgba(255, 255, 255, 0.9)',
        '3d-badge': '0 12px 24px -4px rgba(99, 102, 241, 0.35), 0 4px 8px -2px rgba(99, 102, 241, 0.2), inset 0 2px 1px 0 rgba(255, 255, 255, 0.5)',
        '3d-badge-pink': '0 12px 24px -4px rgba(236, 72, 153, 0.4), 0 4px 8px -2px rgba(236, 72, 153, 0.2), inset 0 2px 1px 0 rgba(255, 255, 255, 0.5)',
        'glass': '0 12px 40px 0 rgba(76, 29, 149, 0.08)',
        'glass-hover': '0 20px 48px 0 rgba(76, 29, 149, 0.15)',
        'glow-violet': '0 0 30px -4px rgba(124, 58, 237, 0.45)',
        'glow-pink': '0 0 30px -4px rgba(236, 72, 153, 0.45)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.4)',
        'glow-teal': '0 0 25px -5px rgba(20, 184, 166, 0.4)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
      }
    },
  },
  plugins: [],
}
