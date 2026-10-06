import { type TeamMember } from '../../api/campaigns'
import { Card } from '../ui/Card'

interface TeamSectionProps {
  teamMembers: TeamMember[]
  className?: string
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-section-heading-size)',
  fontWeight: 'var(--type-section-heading-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-section-heading-spacing)',
  lineHeight: 'var(--type-section-heading-leading)',
  color: 'var(--color-text-primary)',
  margin: 0,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'var(--space-4)',
}

const memberNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-card-title-size)',
  fontWeight: 'var(--type-card-title-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-card-title-spacing)',
  lineHeight: 'var(--type-card-title-leading)',
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-1)',
}

const memberRoleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-accent)',
  letterSpacing: 'var(--type-label-spacing)',
  textTransform: 'uppercase',
  margin: '0 0 var(--space-3)',
}

const memberBioStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  lineHeight: 'var(--type-body-leading)',
}

export function TeamSection({ teamMembers, className }: TeamSectionProps) {
  return (
    <section style={sectionStyle} className={className}>
      <h3 style={headingStyle}>Team</h3>
      <div style={gridStyle}>
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <h4 style={memberNameStyle}>{member.name}</h4>
            <p style={memberRoleStyle}>{member.role}</p>
            <p style={memberBioStyle}>{member.bio}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
