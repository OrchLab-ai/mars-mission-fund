import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveProposal, rejectProposal, resubmitProposal } from '../../api/proposals'
import type { ProposalDetail } from '../../api/proposals'
import type { User } from '@mmf/shared'
import { Button } from '../ui/Button'

interface ReviewActionsPanelProps {
  proposal: ProposalDetail
  user: User | null
}

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-6)',
  background: 'var(--color-bg-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-3-size)',
  fontWeight: 'var(--type-heading-3-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-heading-3-spacing)',
  lineHeight: 'var(--type-heading-3-leading)',
  color: 'var(--color-text-primary)',
  margin: 0,
}

const subheadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-3)',
}

const formSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  paddingTop: 'var(--space-4)',
  borderTop: '1px solid var(--color-border-subtle)',
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const textareaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-3)',
  resize: 'vertical',
  minHeight: '80px',
  width: '100%',
  boxSizing: 'border-box',
}

const errorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-status-error)',
}

function ApproveForm({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => approveProposal(proposalId, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] })
    },
    onError: () => {
      setError('Failed to approve proposal. Please try again.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutate()
  }

  return (
    <form onSubmit={handleSubmit} style={formSectionStyle}>
      <p style={subheadingStyle}>Approve Proposal</p>
      <label style={labelStyle}>
        Notes
        <textarea
          style={textareaStyle}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add approval notes…"
          required
        />
      </label>
      {error && (
        <span role="alert" style={errorStyle}>
          {error}
        </span>
      )}
      <Button type="submit" variant="primary" disabled={isPending || notes.trim() === ''}>
        {isPending ? 'Approving…' : 'Approve'}
      </Button>
    </form>
  )
}

function RejectForm({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient()
  const [rationale, setRationale] = useState('')
  const [guidance, setGuidance] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => rejectProposal(proposalId, rationale, guidance),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] })
    },
    onError: () => {
      setError('Failed to reject proposal. Please try again.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutate()
  }

  const isValid = rationale.trim() !== '' && guidance.trim() !== ''

  return (
    <form onSubmit={handleSubmit} style={formSectionStyle}>
      <p style={subheadingStyle}>Reject Proposal</p>
      <label style={labelStyle}>
        Rationale
        <textarea
          style={textareaStyle}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Explain why the proposal is being rejected…"
          required
        />
      </label>
      <label style={labelStyle}>
        Guidance
        <textarea
          style={textareaStyle}
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder="Provide guidance for resubmission…"
          required
        />
      </label>
      {error && (
        <span role="alert" style={errorStyle}>
          {error}
        </span>
      )}
      <Button type="submit" variant="secondary" disabled={isPending || !isValid}>
        {isPending ? 'Rejecting…' : 'Reject'}
      </Button>
    </form>
  )
}

function ResubmitSection({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => resubmitProposal(proposalId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] })
    },
    onError: () => {
      setError('Failed to resubmit proposal. Please try again.')
    },
  })

  return (
    <div style={formSectionStyle}>
      <p style={subheadingStyle}>Resubmit for Review</p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--type-body-size)',
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}
      >
        Your proposal was rejected. Address the reviewer&apos;s feedback and resubmit for
        consideration.
      </p>
      {error && (
        <span role="alert" style={errorStyle}>
          {error}
        </span>
      )}
      <Button type="button" variant="primary" disabled={isPending} onClick={() => mutate()}>
        {isPending ? 'Resubmitting…' : 'Resubmit'}
      </Button>
    </div>
  )
}

export function ReviewActionsPanel({ proposal, user }: ReviewActionsPanelProps) {
  const isAssignedReviewer =
    user?.role === 'Reviewer' &&
    proposal.status === 'Under Review' &&
    proposal.reviewerId === user.id

  const isCreatorWithRejection =
    user !== null && proposal.status === 'Rejected' && proposal.creatorId === user.id

  if (!isAssignedReviewer && !isCreatorWithRejection) {
    return null
  }

  return (
    <div style={panelStyle} aria-label="Review actions">
      <h2 style={headingStyle}>Review Actions</h2>
      {isAssignedReviewer && (
        <>
          <ApproveForm proposalId={proposal.id} />
          <RejectForm proposalId={proposal.id} />
        </>
      )}
      {isCreatorWithRejection && <ResubmitSection proposalId={proposal.id} />}
    </div>
  )
}
