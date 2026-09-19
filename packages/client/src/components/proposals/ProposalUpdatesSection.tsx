import { type ProposalUpdate } from '../../api/proposals'

interface ProposalUpdatesSectionProps {
  updates: ProposalUpdate[]
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
  gap: 'var(--space-2)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border-default)',
  background: 'var(--color-surface-card)',
}

const dateStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-tertiary)',
  letterSpacing: 'var(--type-label-spacing)',
}

const bodyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  lineHeight: 'var(--type-body-leading)',
}

const emptyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-tertiary)',
  margin: 0,
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ProposalUpdatesSection({ updates, className }: ProposalUpdatesSectionProps) {
  return (
    <section style={sectionStyle} className={className}>
      <h3 style={headingStyle}>Updates</h3>
      {updates.length === 0 ? (
        <p style={emptyStyle}>No updates yet.</p>
      ) : (
        <ul style={listStyle}>
          {updates.map((update) => (
            <li key={update.id} style={itemStyle}>
              <time style={dateStyle} dateTime={update.postedAt.toISOString()}>
                {formatDate(update.postedAt)}
              </time>
              <p style={bodyStyle}>{update.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
