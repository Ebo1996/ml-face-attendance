import { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: 'default' | 'present' | 'late' | 'absent' | 'primary'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const variantStyles = {
  default: 'bg-white border border-gray-200',
  present: 'bg-green-50 border border-green-200',
  late: 'bg-amber-50 border border-amber-200',
  absent: 'bg-red-50 border border-red-200',
  primary: 'bg-blue-50 border border-blue-200',
}

const iconStyles = {
  default: 'text-gray-400',
  present: 'text-green-600',
  late: 'text-amber-600',
  absent: 'text-red-600',
  primary: 'text-blue-600',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}: StatCardProps) {
  return (
    <div className={cn('p-6 rounded-lg transition-shadow hover:shadow-md', variantStyles[variant])}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
        </div>
        <Icon size={24} className={iconStyles[variant]} />
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
    </div>
  )
}
