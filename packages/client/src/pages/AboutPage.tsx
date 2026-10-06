import type { CSSProperties } from 'react'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Card } from '../components/ui/Card'

const sectionStyle: CSSProperties = {
  padding: '80px 24px',
  background: 'var(--color-bg-surface)',
}

const altSectionStyle: CSSProperties = {
  padding: '80px 24px',
  background: 'var(--color-bg-page)',
}

const innerStyle: CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '36px',
  color: 'var(--color-text-primary)',
  marginBottom: '32px',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
}

const bodyStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '18px',
  color: 'var(--color-text-secondary)',
  lineHeight: '1.7',
  maxWidth: '720px',
}

const cardTitleStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '20px',
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  marginBottom: '12px',
}

const cardBodyStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '15px',
  color: 'var(--color-text-secondary)',
  lineHeight: '1.6',
}

const principles = [
  {
    title: 'Transparency',
    description:
      'Every mission publishes full financial breakdowns, milestone targets, and real-time progress. No black boxes.',
  },
  {
    title: 'Accountability',
    description:
      'Mission teams sign binding milestone agreements. Funds are released in tranches tied to verified progress.',
  },
  {
    title: 'Accessibility',
    description:
      'Minimum pledges start at $10. Space exploration funding is no longer reserved for billionaires and institutions.',
  },
  {
    title: 'Long-Term Thinking',
    description:
      'We prioritise missions with 10-year return horizons and compounding civilisational value over quick wins.',
  },
  {
    title: 'Community First',
    description:
      'Backers vote on platform policy changes, featured missions, and resource allocation. Your stake is your voice.',
  },
]

const personas = [
  {
    title: 'Individual Backers',
    description:
      'Everyday citizens who believe the next chapter of human exploration should belong to everyone. From first-timers to seasoned space enthusiasts.',
  },
  {
    title: 'Mission Teams',
    description:
      'Engineers, scientists, and entrepreneurs building the hardware and software that will carry us to the stars. We provide the capital runway they need.',
  },
  {
    title: 'Corporate Partners',
    description:
      'Forward-thinking companies co-funding breakthrough technologies that align with their long-term strategic interests and ESG commitments.',
  },
  {
    title: 'Research Institutions',
    description:
      'Universities and independent labs that need sustainable funding models beyond grant cycles to pursue ambitious, multi-year space science programmes.',
  },
]

export function AboutPage() {
  return (
    <>
      {/* Section 1: Mission Statement */}
      <section style={sectionStyle} aria-labelledby="mission-heading">
        <div style={innerStyle}>
          <SectionLabel number="01" title="OUR MISSION" />
          <h2 id="mission-heading" style={headingStyle}>
            WE EXIST TO FUND THE FUTURE OF SPACE
          </h2>
          <p style={bodyStyle}>
            For too long, space exploration has been the exclusive domain of governments and
            billionaires. Mars Mission Fund exists to change that. We connect mission teams with a
            global community of backers who believe humanity&apos;s future extends beyond Earth —
            and who are willing to put their money where that belief is. Every dollar on this
            platform is a vote for a multi-planetary civilisation.
          </p>
        </div>
      </section>

      {/* Section 2: Problem/Solution */}
      <section style={altSectionStyle} aria-labelledby="challenge-heading">
        <div style={innerStyle}>
          <SectionLabel number="02" title="THE CHALLENGE" />
          <h2 id="challenge-heading" style={headingStyle}>
            THE FUNDING GAP IS THE FINAL FRONTIER
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card accent>
              <h3 style={cardTitleStyle}>The Problem</h3>
              <p style={cardBodyStyle}>
                Promising space missions die on the launchpad every year — not because of technical
                failure, but because of funding failure. Traditional venture capital demands short
                return windows that space timelines simply cannot match. Government grants are
                over-subscribed, politically sensitive, and slow. The result: brilliant engineers
                shelve their most ambitious ideas before they ever reach prototype.
              </p>
            </Card>
            <Card accent>
              <h3 style={cardTitleStyle}>Our Solution</h3>
              <p style={cardBodyStyle}>
                Mars Mission Fund provides patient, community-driven capital structured around
                mission milestones rather than quarterly earnings. Backers fund outcomes they
                believe in, mission teams get the runway they need, and the platform enforces
                accountability through transparent milestone-gated fund releases. The funding gap
                closes one mission at a time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3: Principles */}
      <section style={sectionStyle} aria-labelledby="principles-heading">
        <div style={innerStyle}>
          <SectionLabel number="03" title="HOW WE OPERATE" />
          <h2 id="principles-heading" style={headingStyle}>
            FIVE PRINCIPLES THAT GUIDE EVERY DECISION
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((principle) => (
              <Card key={principle.title} accent>
                <h3 style={cardTitleStyle}>{principle.title}</h3>
                <p style={cardBodyStyle}>{principle.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Who We Serve */}
      <section style={altSectionStyle} aria-labelledby="community-heading">
        <div style={innerStyle}>
          <SectionLabel number="04" title="OUR COMMUNITY" />
          <h2 id="community-heading" style={headingStyle}>
            BUILT FOR BELIEVERS IN THE MISSION
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personas.map((persona) => (
              <Card key={persona.title} accent>
                <h3 style={cardTitleStyle}>{persona.title}</h3>
                <p style={cardBodyStyle}>{persona.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
