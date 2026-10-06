import { type Milestone } from '../../api/campaigns'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'

interface MilestonesSectionProps {
  milestones: Milestone[]
  className?: string
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBD'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  listStyle: 'none',
  padding: 0,
  margin: 0,
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border-default)',
  background: 'var(--color-surface-card)',
}

const itemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'var(--space-2)',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-card-title-size)',
  fontWeight: 'var(--type-card-title-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-card-title-spacing)',
  lineHeight: 'var(--type-card-title-leading)',
  color: 'var(--color-text-primary)',
  margin: 0,
}

const dateStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-tertiary)',
}

const criteriaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
  margin: 0,
}

const progressLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-data)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--type-label-spacing)',
}

const progressRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
}

type BadgeVariant = 'funded' | 'active' | 'new'

const statusBadgeVariant: Record<Milestone['status'], BadgeVariant> = {
  Verified: 'funded',
  Submitted: 'active',
  Pending: 'new',
  Returned: 'new',
}

const statusLabel: Record<Milestone['status'], string> = {
  Verified: 'Verified',
  Submitted: 'Submitted',
  Pending: 'Pending',
  Returned: 'Returned',
}

export function MilestonesSection({ milestones, className }: MilestonesSectionProps) {
  return (
    <section style={sectionStyle} className={className}>
      <h3 style={headingStyle}>Milestones</h3>
      <ol style={listStyle}>
        {milestones.map((milestone) => (
          <li key={milestone.id} style={itemStyle}>
            <div style={itemHeaderStyle}>
              <h4 style={titleStyle}>{milestone.title}</h4>
              <Badge variant={statusBadgeVariant[milestone.status]}>
                {statusLabel[milestone.status]}
              </Badge>
            </div>
            <span style={dateStyle}>Target: {formatDate(milestone.targetDate)}</span>
            <div style={progressRowStyle}>
              <span style={progressLabelStyle}>Funding Progress</span>
              <ProgressBar
                value={milestone.fundingPercentage}
                complete={milestone.fundingPercentage >= 100}
                label={`Milestone funding: ${milestone.fundingPercentage}%`}
              />
            </div>
            <p style={criteriaStyle}>
              <strong>Verification: </strong>
              {milestone.verificationCriteria}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
