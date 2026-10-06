import type { CSSProperties } from 'react'
import { SectionLabel } from './ui/SectionLabel'
import { Card } from './ui/Card'

const sectionStyle: CSSProperties = {
  padding: '80px 24px',
  background: 'var(--color-bg-surface)',
}

const innerStyle: CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: 'var(--type-section-heading-size)',
  color: 'var(--color-text-primary)',
  marginBottom: '48px',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
}

const stepNumberStyle: CSSProperties = {
  fontFamily: 'var(--type-section-label)',
  fontSize: '11px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'var(--color-text-accent)',
  marginBottom: '16px',
}

const stepTitleStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '24px',
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  marginBottom: '12px',
}

const stepDescStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
  lineHeight: '1.6',
}

const steps = [
  {
    number: '01',
    title: 'Discover',
    description:
      'Browse active missions aligned with your vision. Explore detailed mission briefs, team credentials, and funding milestones before committing.',
  },
  {
    number: '02',
    title: 'Back',
    description:
      'Pledge your support and join the mission team. Every contribution moves the launch window closer and earns you a stake in the outcome.',
  },
  {
    number: '03',
    title: 'Track',
    description:
      'Follow progress with real-time mission updates. Get direct access to mission logs, milestone reports, and team communications.',
  },
]

export function HowItWorksSection() {
  return (
    <section style={sectionStyle} aria-labelledby="how-it-works-heading">
      <div style={innerStyle}>
        <SectionLabel number="02" title="HOW IT WORKS" />
        <h2 id="how-it-works-heading" style={headingStyle}>
          FROM BACKER TO MISSION PARTNER
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <Card key={step.number} accent>
              <p style={stepNumberStyle}>{step.number}</p>
              <h3 style={stepTitleStyle}>{step.title}</h3>
              <p style={stepDescStyle}>{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
