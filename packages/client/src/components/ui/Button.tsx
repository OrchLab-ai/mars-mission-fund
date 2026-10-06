import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface BaseButtonProps {
  variant?: ButtonVariant
  children: ReactNode
  className?: string
}

type ButtonAsButton = BaseButtonProps & {
  href?: undefined
} & ButtonHTMLAttributes<HTMLButtonElement>
type ButtonAsAnchor = BaseButtonProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>

type ButtonProps = ButtonAsButton | ButtonAsAnchor

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: 'var(--radius-button)',
  fontFamily: 'var(--type-button)',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.01em',
  lineHeight: 1,
  cursor: 'pointer',
  textDecoration: 'none',
  border: 'none',
  transition:
    'background var(--motion-hover), color var(--motion-hover), border-color var(--motion-hover), box-shadow var(--motion-hover)',
  whiteSpace: 'nowrap',
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--gradient-action-primary)',
    color: 'var(--color-action-primary-text)',
    boxShadow: '0 4px 16px var(--color-action-primary-shadow)',
  },
  secondary: {
    background: 'var(--color-action-secondary-bg)',
    color: 'var(--color-action-secondary-text)',
    border: '1px solid var(--color-action-secondary-border)',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-action-ghost-text)',
    border: '1px solid var(--color-action-ghost-border)',
    boxShadow: 'none',
  },
}

const disabledStyle: React.CSSProperties = {
  background: 'var(--color-action-disabled)',
  color: 'var(--color-bg-page)',
  border: 'none',
  boxShadow: 'none',
  cursor: 'not-allowed',
  opacity: 0.7,
}

const focusStyle = `
  .mmf-button:focus-visible {
    outline: 2px solid var(--color-action-primary-hover);
    outline-offset: 2px;
  }
  .mmf-button:hover:not(:disabled):not([aria-disabled="true"]) {
    filter: brightness(1.1);
  }
`

let styleInjected = false

function ensureStyle() {
  if (styleInjected || typeof document === 'undefined') return
  styleInjected = true
  const el = document.createElement('style')
  el.textContent = focusStyle
  document.head.appendChild(el)
}

export function Button(props: ButtonProps) {
  ensureStyle()

  const { variant = 'primary', children, className, ...rest } = props

  const combinedStyle: React.CSSProperties = {
    ...baseStyle,
    ...variantStyles[variant],
  }

  if (props.href !== undefined) {
    const { href, ...anchorRest } = rest as ButtonAsAnchor
    return (
      <a
        href={href}
        className={`mmf-button${className ? ` ${className}` : ''}`}
        style={combinedStyle}
        {...anchorRest}
      >
        {children}
      </a>
    )
  }

  const { disabled, ...buttonRest } = rest as ButtonAsButton

  return (
    <button
      disabled={disabled}
      className={`mmf-button${className ? ` ${className}` : ''}`}
      style={disabled ? { ...baseStyle, ...disabledStyle } : combinedStyle}
      aria-disabled={disabled}
      {...buttonRest}
    >
      {children}
    </button>
  )
}
