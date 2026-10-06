import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { verifyMilestone, returnMilestone, approveCancel } from '../../api/campaigns'
import type { CampaignDetail, Milestone } from '../../api/campaigns'
import type { User } from '@mmf/shared'
import { Button } from '../ui/Button'

interface AdminActionsPanelProps {
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

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  paddingTop: 'var(--space-4)',
  borderTop: '1px solid var(--color-border-subtle)',
}

const milestoneItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  paddingTop: 'var(--space-3)',
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

const metaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
  margin: 0,
}

const errorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-status-error)',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-accent-primary)',
  textDecoration: 'underline',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
}

function MilestoneVerifyItem({
  campaignId,
  milestone,
}: {
  campaignId: string
  milestone: Milestone
}) {
  const queryClient = useQueryClient()
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [returnError, setReturnError] = useState<string | null>(null)

  const verifyMutation = useMutation({
    mutationFn: () => verifyMilestone(campaignId, milestone.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
    },
    onError: () => {
      setVerifyError('Failed to verify milestone. Please try again.')
    },
  })

  const returnMutation = useMutation({
    mutationFn: () => returnMilestone(campaignId, milestone.id, feedback),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
    },
    onError: () => {
      setReturnError('Failed to return milestone. Please try again.')
    },
  })

  function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault()
    setReturnError(null)
    returnMutation.mutate()
  }

  return (
    <div style={milestoneItemStyle}>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--type-body-size)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          margin: 0,
        }}
      >
        {milestone.title}
      </p>

      {milestone.evidenceDescription && <p style={metaStyle}>{milestone.evidenceDescription}</p>}

      {milestone.evidenceUrl && (
        <a
          href={milestone.evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          aria-label={`Evidence URL for ${milestone.title}`}
        >
          View evidence
        </a>
      )}

      {milestone.evidenceSubmittedAt && (
        <p style={metaStyle}>
          Submitted: {new Date(milestone.evidenceSubmittedAt).toLocaleDateString()}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <Button
          type="button"
          variant="primary"
          disabled={verifyMutation.isPending}
          onClick={() => {
            setVerifyError(null)
            verifyMutation.mutate()
          }}
        >
          {verifyMutation.isPending ? 'Verifying…' : 'Verify'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowReturnForm((prev) => !prev)}
        >
          Return
        </Button>
      </div>

      {verifyError && (
        <span role="alert" style={errorStyle}>
          {verifyError}
        </span>
      )}

      {showReturnForm && (
        <form
          onSubmit={handleReturnSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          <label style={labelStyle}>
            Feedback
            <textarea
              style={textareaStyle}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Explain what needs to be addressed…"
              required
            />
          </label>
          {returnError && (
            <span role="alert" style={errorStyle}>
              {returnError}
            </span>
          )}
          <Button
            type="submit"
            variant="secondary"
            disabled={returnMutation.isPending || feedback.trim() === ''}
          >
            {returnMutation.isPending ? 'Returning…' : 'Submit Return'}
          </Button>
        </form>
      )}
    </div>
  )
}

function MilestoneVerificationSection({ campaign }: { campaign: CampaignDetail }) {
  const submittedMilestones = campaign.milestones.filter((m) => m.status === 'Submitted')

  if (submittedMilestones.length === 0) return null

  return (
    <div style={sectionStyle}>
      <p style={subheadingStyle}>Milestone Verification</p>
      {submittedMilestones.map((milestone) => (
        <MilestoneVerifyItem key={milestone.id} campaignId={campaign.id} milestone={milestone} />
      ))}
    </div>
  )
}

function CancellationApprovalSection({ campaign }: { campaign: CampaignDetail }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const approveMutation = useMutation({
    mutationFn: () => approveCancel(campaign.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaign.id] })
    },
    onError: () => {
      setError('Failed to approve cancellation. Please try again.')
    },
  })

  return (
    <div style={sectionStyle}>
      <p style={subheadingStyle}>Pending Cancellation Request</p>
      <p style={metaStyle}>
        Requested:{' '}
        {campaign.cancellationRequestedAt
          ? new Date(campaign.cancellationRequestedAt).toLocaleDateString()
          : ''}
      </p>
      {error && (
        <span role="alert" style={errorStyle}>
          {error}
        </span>
      )}
      <Button
        type="button"
        variant="secondary"
        disabled={approveMutation.isPending}
        onClick={() => {
          setError(null)
          approveMutation.mutate()
        }}
      >
        {approveMutation.isPending ? 'Approving…' : 'Approve Cancellation'}
      </Button>
    </div>
  )
}

export function AdminActionsPanel({ campaign, user }: AdminActionsPanelProps) {
  const isAdmin = user?.role === 'Administrator' || user?.role === 'SuperAdministrator'

  if (!isAdmin) return null

  const showMilestoneVerification = campaign.status === 'Settlement'
  const showCancellationApproval =
    campaign.status === 'Live' && campaign.cancellationRequestedAt != null

  if (!showMilestoneVerification && !showCancellationApproval) return null

  return (
    <div style={panelStyle} aria-label="Admin actions">
      <h2 style={headingStyle}>Admin Actions</h2>
      {showMilestoneVerification && <MilestoneVerificationSection campaign={campaign} />}
      {showCancellationApproval && <CancellationApprovalSection campaign={campaign} />}
    </div>
  )
}
