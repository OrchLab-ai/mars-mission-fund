import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@mmf/shared'
import { useProposalUpdates } from '../../hooks/useProposalUpdates'
import { postProposalUpdate } from '../../api/proposals'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

const TITLE_MAX_LENGTH = 120
const BODY_MAX_LENGTH = 5000

interface UpdatesSectionProps {
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

const updateTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-card-title-size)',
  fontWeight: 'var(--type-card-title-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-card-title-spacing)',
  lineHeight: 'var(--type-card-title-leading)',
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-1)',
}

const metaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-tertiary)',
  margin: '0 0 var(--space-3)',
}

// pre-wrap keeps the line breaks the creator typed; the body is plain text, never HTML
const bodyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  lineHeight: 'var(--type-body-leading)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}

const statusTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  lineHeight: 'var(--type-body-leading)',
  color: 'var(--color-text-secondary)',
  margin: 0,
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-label-spacing)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const fieldStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-3)',
  width: '100%',
  boxSizing: 'border-box',
  // Labels are uppercase; the text people type should not be
  textTransform: 'none',
  letterSpacing: 'normal',
  fontWeight: 400,
}

const textareaStyle: React.CSSProperties = {
  ...fieldStyle,
  resize: 'vertical',
  minHeight: '120px',
}

const errorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-status-error)',
}

const successStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
}

function PostUpdateForm({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => postProposalUpdate(proposalId, { title: title.trim(), body: body.trim() }),
    onSuccess: () => {
      setTitle('')
      setBody('')
      setPosted(true)
      void queryClient.invalidateQueries({ queryKey: ['proposal-updates', proposalId] })
    },
    onError: () => {
      setError("We couldn't post your update. Check your connection and try again.")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPosted(false)
    mutate()
  }

  const isBlank = title.trim() === '' || body.trim() === ''

  return (
    <Card>
      <form onSubmit={handleSubmit} style={formStyle} aria-label="Post an update">
        <label style={labelStyle}>
          Title
          <input
            type="text"
            style={fieldStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            placeholder="What happened?"
            required
          />
        </label>
        <label style={labelStyle}>
          Update
          <textarea
            style={textareaStyle}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={BODY_MAX_LENGTH}
            placeholder="Share progress, setbacks or milestone news with your backers."
            required
          />
        </label>
        {error && (
          <span role="alert" style={errorStyle}>
            {error}
          </span>
        )}
        {posted && (
          <span role="status" style={successStyle}>
            Update posted.
          </span>
        )}
        <div>
          <Button type="submit" variant="primary" disabled={isPending || isBlank}>
            {isPending ? 'Posting…' : 'Post update'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function UpdatesSection({ proposalId, creatorId, user, className }: UpdatesSectionProps) {
  const { data: updates, isLoading, isError } = useProposalUpdates(proposalId)

  // The server enforces the same rule; this only decides whether to show the form
  const canPost = user !== null && user.role === 'Creator' && user.id === creatorId

  const newestFirst = updates
    ? [...updates].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : []

  return (
    <section style={sectionStyle} className={className} aria-labelledby="proposal-updates-heading">
      <h3 id="proposal-updates-heading" style={headingStyle}>
        Updates
      </h3>

      {canPost && <PostUpdateForm proposalId={proposalId} />}

      {isLoading && (
        <p style={statusTextStyle} aria-busy="true">
          Loading updates…
        </p>
      )}

      {isError && (
        <p role="alert" style={errorStyle}>
          We couldn&apos;t load updates right now. Try again in a few minutes.
        </p>
      )}

      {updates && newestFirst.length === 0 && (
        <p style={statusTextStyle}>No updates yet. The mission team will post progress here.</p>
      )}

      {newestFirst.length > 0 && (
        <ol style={listStyle}>
          {newestFirst.map((update) => (
            <li key={update.id}>
              <Card>
                <h4 style={updateTitleStyle}>{update.title}</h4>
                <p style={metaStyle}>
                  {update.authorName ?? 'Mission team'} ·{' '}
                  <time dateTime={update.createdAt.toISOString()}>
                    {formatDate(update.createdAt)}
                  </time>
                </p>
                <p style={bodyStyle}>{update.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
