import { useId } from 'react'
import type { User } from '@mmf/shared'
import { useMissionUpdates } from '../../hooks/useMissionUpdates'

interface MissionUpdatesSectionProps {
  proposalId: string
  creatorId: string | null
  user: User | null
  className?: string
}

function formatDate(date: Date): string {
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

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-bg-surface)',
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

const metaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-tertiary)',
}

const bodyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  whiteSpace: 'pre-wrap',
}

const messageStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
  margin: 0,
}

export function MissionUpdatesSection({
  proposalId,
  creatorId,
  user,
  className,
}: MissionUpdatesSectionProps) {
  const headingId = useId()
  const { data: updates, isLoading, isError } = useMissionUpdates(proposalId)
  const isOwner = user !== null && user.id === creatorId

  function renderContent() {
    if (isLoading) return <p style={messageStyle}>Loading updates…</p>
    if (isError || !updates) {
      return (
        <p style={messageStyle}>
          {"We couldn't load the updates right now. Refresh the page to try again."}
        </p>
      )
    }
    if (updates.length === 0) {
      return (
        <p style={messageStyle}>
          {isOwner
            ? 'Your crew is waiting to hear from you. Post the first update above.'
            : 'No updates yet. When the crew posts progress, it lands here first.'}
        </p>
      )
    }
    return (
      <ol style={listStyle}>
        {updates.map((update) => (
          <li key={update.id} style={cardStyle}>
            <h4 style={titleStyle}>{update.title}</h4>
            <span style={metaStyle}>
              {update.authorName ?? 'Mission crew'} ·{' '}
              <time dateTime={update.createdAt.toISOString()}>{formatDate(update.createdAt)}</time>
            </span>
            <p style={bodyStyle}>{update.body}</p>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <section aria-labelledby={headingId} style={sectionStyle} className={className}>
      <h3 id={headingId} style={headingStyle}>
        Mission updates
      </h3>
      {renderContent()}
    </section>
  )
}
