import type { CSSProperties } from 'react'

interface SectionLabelProps {
  number: string
  title: string
  className?: string
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--type-section-label)',
  fontSize: '11px',
  fontWeight: 400,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'var(--color-text-accent)',
  marginBottom: '16px',
}

export function SectionLabel({ number, title, className }: SectionLabelProps) {
  return (
    <p style={labelStyle} className={className}>
      {number} — {title}
    </p>
  )
}
