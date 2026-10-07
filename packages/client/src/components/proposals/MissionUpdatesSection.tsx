import { useId, useState, type FormEvent } from 'react'
import type { User } from '@mmf/shared'
import { useMissionUpdates } from '../../hooks/useMissionUpdates'
import { useCreateMissionUpdate } from '../../hooks/useCreateMissionUpdate'

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

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-bg-surface)',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const helpStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-tertiary)',
  margin: 0,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: 'var(--color-action-primary)',
  color: 'var(--color-action-primary-text)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-5)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
  cursor: 'pointer',
}

const errorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-status-error)',
  margin: 0,
}

function MissionUpdateForm({ proposalId }: { proposalId: string }) {
  const ids = useId()
  const titleId = `${ids}-title`
  const titleHelpId = `${ids}-title-help`
  const bodyId = `${ids}-body`
  const bodyHelpId = `${ids}-body-help`
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [failed, setFailed] = useState(false)
  const mutation = useCreateMissionUpdate(proposalId)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFailed(false)
    mutation.mutate(
      { title, body },
      {
        onSuccess: () => {
          setTitle('')
          setBody('')
        },
        onError: () => setFailed(true),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={fieldStyle}>
        <label htmlFor={titleId} style={labelStyle}>
          Title
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          maxLength={120}
          required
          aria-describedby={titleHelpId}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
        <p id={titleHelpId} style={helpStyle}>
          Keep it short, like a headline. Up to 120 characters.
        </p>
      </div>
      <div style={fieldStyle}>
        <label htmlFor={bodyId} style={labelStyle}>
          {"What's happening?"}
        </label>
        <textarea
          id={bodyId}
          value={body}
          maxLength={5000}
          required
          rows={5}
          aria-describedby={bodyHelpId}
          onChange={(e) => setBody(e.target.value)}
          style={inputStyle}
        />
        <p id={bodyHelpId} style={helpStyle}>
          {"Progress, setbacks, what's next. Plain text, up to 5,000 characters."}
        </p>
      </div>
      {failed && (
        <p role="alert" style={errorStyle}>
          {"That update didn't go through. Your text is still here, so try posting again."}
        </p>
      )}
      <button type="submit" disabled={mutation.isPending} style={buttonStyle}>
        Post update
      </button>
    </form>
  )
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
  const canPost = isOwner && user.role === 'Creator'

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
      {canPost && <MissionUpdateForm proposalId={proposalId} />}
      {renderContent()}
    </section>
  )
}
