import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from './Button'

export interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  backButton?: {
    label?: string
    onClick: () => void
  }
}

export function PageHeader({ title, description, action, backButton }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={backButton.onClick}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backButton.label || 'Back'}
        </Button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}
