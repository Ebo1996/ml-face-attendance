/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: { DEFAULT: '#6366f1', foreground: '#ffffff', light: '#818cf8', dark: '#4f46e5' },
        // Sidebar
        sidebar: { bg: '#0f172a', hover: '#1e293b', active: '#1e293b', border: '#1e293b', text: '#94a3b8', 'text-active': '#f1f5f9' },
        // Semantic
        background: '#f1f5f9',
        foreground: '#0f172a',
        card: '#ffffff',
        'card-foreground': '#0f172a',
        muted: '#e2e8f0',
        'muted-foreground': '#64748b',
        border: '#e2e8f0',
        ring: '#6366f1',
        // Status
        success: { DEFAULT: '#10b981', light: '#d1fae5', dark: '#059669' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#d97706' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#dc2626' },
        info:    { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#2563eb' },
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.1)',
        stat: '0 4px 24px -4px rgba(99,102,241,0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        'count-up': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'count-up': 'count-up 0.5s ease-out',
      },
      backgroundImage: {
        'gradient-primary':  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-success':  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-warning':  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-danger':   'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-info':     'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'gradient-dark':     'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-header':   'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%)',
      },
    },
  },
  plugins: [],
}
