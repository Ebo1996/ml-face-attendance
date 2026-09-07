import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
    ].join(' ')

    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      ghost: 'hover:bg-gray-100 text-gray-700',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
      link: 'text-blue-600 underline-offset-4 hover:underline',
    }

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs rounded-md',
      lg: 'h-11 px-8 text-base rounded-md',
      icon: 'h-10 w-10',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading…</span>
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
