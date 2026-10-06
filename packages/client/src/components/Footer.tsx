import { Link } from 'react-router'
import { Logo } from './ui/Logo'

const footerStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  borderTop: '1px solid var(--color-border-subtle)',
  padding: '48px 24px',
}

const innerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '32px',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
}

const brandColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const taglineStyle: React.CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  maxWidth: '240px',
  lineHeight: 1.5,
}

const navColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const navLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--type-section-label)',
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  marginBottom: '4px',
}

const linkStyle: React.CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  transition: 'color var(--motion-hover)',
}

const copyrightStyle: React.CSSProperties = {
  width: '100%',
  borderTop: '1px solid var(--color-border-subtle)',
  paddingTop: '24px',
  fontFamily: 'var(--type-body)',
  fontSize: '13px',
  color: 'var(--color-text-tertiary)',
}

const footerCss = `
  .mmf-footer-link:hover {
    color: var(--color-text-primary) !important;
  }
  .mmf-footer-link:focus-visible {
    outline: 2px solid var(--color-action-primary-hover);
    outline-offset: 2px;
    border-radius: 2px;
  }
  @media (max-width: 768px) {
    .mmf-footer-inner {
      flex-direction: column !important;
    }
  }
`

let footerStyleInjected = false
function ensureFooterStyle() {
  if (footerStyleInjected || typeof document === 'undefined') return
  footerStyleInjected = true
  const el = document.createElement('style')
  el.textContent = footerCss
  document.head.appendChild(el)
}

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Footer() {
  ensureFooterStyle()

  return (
    <footer style={footerStyle}>
      <div className="mmf-footer-inner" style={innerStyle}>
        <div style={brandColStyle}>
          <Logo size="md" />
          <p style={taglineStyle}>Your stake. Their mission. Our planet.</p>
        </div>

        <nav aria-label="Footer navigation" style={navColStyle}>
          <span style={navLabelStyle}>Navigation</span>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className="mmf-footer-link" style={linkStyle}>
              {label}
            </Link>
          ))}
        </nav>

        <p style={copyrightStyle}>© 2026 Mars Mission Fund. All rights reserved.</p>
      </div>
    </footer>
  )
}
