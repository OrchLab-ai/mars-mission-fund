import { type ReactNode } from 'react'

interface CardProps {
  accent?: boolean
  children: ReactNode
  className?: string
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-card)',
  padding: '32px',
  position: 'relative',
  overflow: 'hidden',
}

const accentBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  background: 'linear-gradient(to right, var(--color-border-accent), var(--color-status-warning))',
}

export function Card({ accent = false, children, className }: CardProps) {
  return (
    <div style={cardStyle} className={className}>
      {accent && <div style={accentBarStyle} aria-hidden="true" />}
      {children}
    </div>
  )
}
