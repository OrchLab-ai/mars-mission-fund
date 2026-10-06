import type { CSSProperties } from 'react'
import { SectionLabel } from './ui/SectionLabel'
import { MissionCard } from './MissionCard'

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

const missions = [
  {
    title: 'Lunar Regolith Harvester',
    description:
      'An autonomous system for extracting and processing lunar regolith into usable construction materials for permanent lunar habitation.',
    badge: 'PROPULSION',
    progress: 67,
    raised: '$2.8M',
    goal: '$4.2M',
  },
  {
    title: 'Deep Space Comms Array',
    description:
      'A network of relay satellites enabling high-bandwidth communications between Earth, the Moon, and future Mars outposts.',
    badge: 'COMMS',
    progress: 43,
    raised: '$1.3M',
    goal: '$3.0M',
  },
  {
    title: 'Mars Atmospheric Processor',
    description:
      'A pilot-scale unit that converts CO₂ in the Martian atmosphere into oxygen and methane propellant for return missions.',
    badge: 'LIFE SUPPORT',
    progress: 81,
    raised: '$5.7M',
    goal: '$7.0M',
  },
]

export function FeaturedMissionsSection() {
  return (
    <section style={sectionStyle} aria-labelledby="featured-missions-heading">
      <div style={innerStyle}>
        <SectionLabel number="03" title="ACTIVE MISSIONS" />
        <h2 id="featured-missions-heading" style={headingStyle}>
          MISSIONS SEEKING BACKERS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <MissionCard key={mission.title} {...mission} />
          ))}
        </div>
      </div>
    </section>
  )
}
