import { type ReactNode } from 'react'

type BadgeVariant = 'funded' | 'active' | 'new' | 'accent'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<
  BadgeVariant,
  { badge: React.CSSProperties; dot: React.CSSProperties }
> = {
  funded: {
    badge: {
      background: 'var(--color-status-success-bg)',
      color: 'var(--color-status-success)',
      border: '1px solid var(--color-status-success-border)',
    },
    dot: {
      background: 'var(--color-status-success)',
    },
  },
  active: {
    badge: {
      background: 'var(--color-status-active-bg)',
      color: 'var(--color-status-active)',
      border: '1px solid var(--color-status-active-border)',
    },
    dot: {
      background: 'var(--color-status-active)',
    },
  },
  new: {
    badge: {
      background: 'var(--color-status-new-bg)',
      color: 'var(--color-status-new)',
      border: '1px solid var(--color-status-new-border)',
    },
    dot: {
      background: 'var(--color-status-new)',
    },
  },
  accent: {
    badge: {
      background: 'rgba(26, 58, 110, 0.3)',
      color: 'var(--color-text-accent)',
      border: '1px solid var(--color-border-accent)',
    },
    dot: {
      background: 'var(--color-text-accent)',
    },
  },
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: 'var(--radius-badge)',
  fontFamily: 'var(--type-button)',
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: 1,
  whiteSpace: 'nowrap',
}

const dotBaseStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  flexShrink: 0,
}

export function Badge({ variant, children, className }: BadgeProps) {
  const { badge, dot } = variantStyles[variant]

  return (
    <span className={className} style={{ ...baseStyle, ...badge }}>
      <span aria-hidden="true" style={{ ...dotBaseStyle, ...dot }} />
      {children}
    </span>
  )
}
