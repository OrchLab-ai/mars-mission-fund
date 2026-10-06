import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveCampaign, rejectCampaign, resubmitCampaign } from '../../api/campaigns'
import type { CampaignDetail } from '../../api/campaigns'
import type { User } from '@mmf/shared'
import { Button } from '../ui/Button'

interface ReviewActionsPanelProps {
  campaign: CampaignDetail
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

function ApproveForm({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => approveCampaign(campaignId, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
    },
    onError: () => {
      setError('Failed to approve campaign. Please try again.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutate()
  }

  return (
    <form onSubmit={handleSubmit} style={formSectionStyle}>
      <p style={subheadingStyle}>Approve Campaign</p>
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

function RejectForm({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient()
  const [rationale, setRationale] = useState('')
  const [guidance, setGuidance] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => rejectCampaign(campaignId, rationale, guidance),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
    },
    onError: () => {
      setError('Failed to reject campaign. Please try again.')
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
      <p style={subheadingStyle}>Reject Campaign</p>
      <label style={labelStyle}>
        Rationale
        <textarea
          style={textareaStyle}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Explain why the campaign is being rejected…"
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

function ResubmitSection({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => resubmitCampaign(campaignId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
    },
    onError: () => {
      setError('Failed to resubmit campaign. Please try again.')
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
        Your campaign was rejected. Address the reviewer&apos;s feedback and resubmit for
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

export function ReviewActionsPanel({ campaign, user }: ReviewActionsPanelProps) {
  const isAssignedReviewer =
    user?.role === 'Reviewer' &&
    campaign.status === 'Under Review' &&
    campaign.reviewerId === user.id

  const isCreatorWithRejection =
    user !== null && campaign.status === 'Rejected' && campaign.creatorId === user.id

  if (!isAssignedReviewer && !isCreatorWithRejection) {
    return null
  }

  return (
    <div style={panelStyle} aria-label="Review actions">
      <h2 style={headingStyle}>Review Actions</h2>
      {isAssignedReviewer && (
        <>
          <ApproveForm campaignId={campaign.id} />
          <RejectForm campaignId={campaign.id} />
        </>
      )}
      {isCreatorWithRejection && <ResubmitSection campaignId={campaign.id} />}
    </div>
  )
}
