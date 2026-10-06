import type { CSSProperties } from 'react'
import { Button } from './ui/Button'

const sectionStyle: CSSProperties = {
  padding: '120px 24px',
  background: 'var(--gradient-surface-card)',
  textAlign: 'center',
}

const innerStyle: CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '40px',
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  marginBottom: '24px',
  lineHeight: '1.1',
}

const subtextStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: 'var(--text-base)',
  color: 'var(--color-text-secondary)',
  lineHeight: '1.6',
  marginBottom: '48px',
}

export function ClosingCtaSection() {
  return (
    <section style={sectionStyle} aria-labelledby="closing-cta-heading">
      <div style={innerStyle}>
        <h2 id="closing-cta-heading" style={headingStyle}>
          EVERY DOLLAR MOVES THE LAUNCH WINDOW CLOSER
        </h2>
        <p style={subtextStyle}>
          Join thousands of backers already funding the next chapter of human space exploration.
          Find a mission that matches your vision and make your mark on history.
        </p>
        <Button variant="secondary" href="/campaigns">
          Browse All Missions
        </Button>
      </div>
    </section>
  )
}
