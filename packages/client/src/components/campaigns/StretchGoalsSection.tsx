import { type StretchGoal } from '../../api/campaigns'

interface StretchGoalsSectionProps {
  stretchGoals: StretchGoal[]
  className?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
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

const itemBaseStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border-default)',
}

const unlockedStyle: React.CSSProperties = {
  ...itemBaseStyle,
  background: 'var(--color-surface-card)',
  borderColor: 'var(--color-status-success)',
}

const lockedStyle: React.CSSProperties = {
  ...itemBaseStyle,
  background: 'var(--color-surface-muted)',
}

const itemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
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

const unlockedBadgeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-status-success)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--type-label-spacing)',
}

const lockedBadgeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--type-label-spacing)',
}

const deliverablesStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-tertiary)',
  margin: 0,
}

const amountStyle: React.CSSProperties = {
  fontFamily: 'var(--font-data)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--type-label-spacing)',
}

export function StretchGoalsSection({ stretchGoals, className }: StretchGoalsSectionProps) {
  if (stretchGoals.length === 0) return null

  return (
    <section style={sectionStyle} className={className}>
      <h3 style={headingStyle}>Stretch Goals</h3>
      <ul style={listStyle}>
        {stretchGoals.map((goal) => (
          <li key={goal.id} style={goal.unlocked ? unlockedStyle : lockedStyle}>
            <div style={itemHeaderStyle}>
              <h4 style={titleStyle}>{goal.description}</h4>
              <span style={goal.unlocked ? unlockedBadgeStyle : lockedBadgeStyle}>
                {goal.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            {goal.deliverables && <p style={deliverablesStyle}>{goal.deliverables}</p>}
            <span style={amountStyle}>Target: {formatCurrency(goal.targetAmount)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
