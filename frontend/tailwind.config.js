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
          DEFAULT: '#2368a2',
          foreground: '#ffffff',
        },
        background: '#f7f8fa',
        foreground: '#172033',
        card: '#ffffff',
        'card-foreground': '#172033',
        muted: '#eef2f6',
        'muted-foreground': '#667085',
        border: '#e3e8ef',
        ring: '#2368a2',
      },
      borderRadius: {
        lg: '0.75rem',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out-to-top': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },
      },
      animation: {
        'in': 'in 200ms ease-out',
        'out': 'out 200ms ease-in',
        'slide-in-from-top-5': 'slide-in-from-top 300ms ease-out',
        'slide-out-to-top-5': 'slide-out-to-top 300ms ease-in',
      },
    },
  },
  plugins: [],
}
