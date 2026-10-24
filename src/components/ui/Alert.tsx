import React from 'react'

type AlertType = 'error' | 'success' | 'warning' | 'info'

const alertStyles: Record<AlertType, string> = {
  error:   'bg-red-50     border-red-200     text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50   border-amber-200   text-amber-800',
  info:    'bg-blue-50    border-blue-200    text-blue-800',
}

const alertIcons: Record<AlertType, string> = {
  error:   '✕',
  success: '✓',
  warning: '⚠',
  info:    'ℹ',
}

interface AlertProps {
  type: AlertType
  title?: string
  children: React.ReactNode
  className?: string
}

export function Alert({ type, title, children, className = '' }: AlertProps) {
  return (
    <div
      className={`border rounded-lg p-4 flex gap-3 ${alertStyles[type]} ${className}`}
      role="alert"
    >
      <span className="text-lg leading-none mt-0.5 flex-shrink-0">{alertIcons[type]}</span>
      <div className="text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
