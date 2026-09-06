import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: () => void
}

export function Toast({ type, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }
  
  const styles = {
    success: 'bg-green-50 text-green-900 border-green-200',
    error: 'bg-red-50 text-red-900 border-red-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
  }
  
  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-amber-600',
  }
  
  const Icon = icons[type]
  
  return createPortal(
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-lg border shadow-lg transition-all',
        styles[type],
        isVisible
          ? 'animate-in slide-in-from-top-5 fade-in'
          : 'animate-out slide-out-to-top-5 fade-out'
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', iconColors[type])} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="flex-shrink-0 rounded-full p-1 hover:bg-black/10 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body
  )
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([])
  
  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [
      ...prev,
      {
        ...toast,
        id,
        onClose: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      },
    ])
  }
  
  // Expose addToast globally
  useEffect(() => {
    ;(window as any).addToast = addToast
    return () => {
      delete (window as any).addToast
    }
  }, [])
  
  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  )
}

// Helper function to show toasts
export const toast = {
  success: (message: string) => {
    ;(window as any).addToast?.({ type: 'success', message })
  },
  error: (message: string) => {
    ;(window as any).addToast?.({ type: 'error', message })
  },
  info: (message: string) => {
    ;(window as any).addToast?.({ type: 'info', message })
  },
  warning: (message: string) => {
    ;(window as any).addToast?.({ type: 'warning', message })
  },
}
