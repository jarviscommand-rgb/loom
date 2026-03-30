/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        loom: {
          bg: '#0a0a0f',
          'bg-alt': '#0e0e16',
          surface: '#12121a',
          'surface-hover': '#1a1a28',
          border: '#1e1e2e',
          'border-subtle': '#16162a',
          accent: '#8b5cf6',
          'accent-dim': '#6d28d9',
          tension: '#ef4444',
          'tension-dim': '#b91c1c',
          glow: '#f97316',
          'glow-dim': '#c2410c',
          calm: '#22d3ee',
          'calm-dim': '#0e7490',
          success: '#22c55e',
          warning: '#eab308',
          text: '#e2e8f0',
          'text-secondary': '#cbd5e1',
          muted: '#64748b',
          'muted-dim': '#475569',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Crimson Pro', 'serif'],
      },
      fontSize: {
        /** Typography scale: consistent hierarchy */
        'heading-xl': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'heading-lg': ['1.375rem', { lineHeight: '1.875rem', fontWeight: '700' }],
        'heading-md': ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600' }],
        'heading-sm': ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'body-lg': ['0.875rem', { lineHeight: '1.375rem' }],
        'body': ['0.8125rem', { lineHeight: '1.25rem' }],
        'body-sm': ['0.75rem', { lineHeight: '1.125rem' }],
        'caption': ['0.6875rem', { lineHeight: '1rem' }],
        'micro': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
