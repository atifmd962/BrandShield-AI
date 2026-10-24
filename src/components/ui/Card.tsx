import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm ${padding ? 'p-6' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-base font-semibold text-slate-800 ${className}`}>{children}</h2>
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 mt-0.5">{children}</p>
}
