import type { CSSProperties } from 'react'
import { SectionLabel } from './ui/SectionLabel'
import { StatCard } from './ui/StatCard'

const sectionStyle: CSSProperties = {
  padding: '80px 24px',
  background: 'var(--color-bg-page)',
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

const stats = [
  {
    label: 'Total Funded',
    value: '$4.2M',
    subText: 'Across all missions',
    subVariant: 'positive' as const,
  },
  {
    label: 'Active Missions',
    value: '127',
    subText: 'And counting',
    subVariant: 'neutral' as const,
  },
  {
    label: 'Total Backers',
    value: '18,400',
    subText: 'Mission believers',
    subVariant: 'positive' as const,
  },
  {
    label: 'Success Rate',
    value: '94%',
    subText: 'Missions reaching goal',
    subVariant: 'positive' as const,
  },
]

export function StatsSection() {
  return (
    <section style={sectionStyle} aria-labelledby="stats-heading">
      <div style={innerStyle}>
        <SectionLabel number="01" title="PLATFORM IMPACT" />
        <h2 id="stats-heading" style={headingStyle}>
          THE NUMBERS SO FAR
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              subText={stat.subText}
              subVariant={stat.subVariant}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
