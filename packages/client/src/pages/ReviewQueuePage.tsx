import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchReviewQueue, claimCampaign } from '../api/campaigns'
import type { CampaignSummary } from '../api/campaigns'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
}

const contentStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: 'var(--space-8) var(--space-6)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-2-size)',
  fontWeight: 'var(--type-heading-2-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-heading-2-spacing)',
  lineHeight: 'var(--type-heading-2-leading)',
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-2)',
}

const subheadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--space-6)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '2px solid var(--color-border-subtle)',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--type-body-small-size)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-border-subtle)',
  verticalAlign: 'middle',
}

const claimButtonStyle: React.CSSProperties = {
  background: 'var(--color-accent-primary)',
  color: 'var(--color-text-on-accent)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-4)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  cursor: 'pointer',
}

const claimButtonDisabledStyle: React.CSSProperties = {
  ...claimButtonStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
}

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
}

const errorStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-status-error)',
}

const emptyStyle: React.CSSProperties = {
  padding: 'var(--space-12) 0',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
}

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [claimError, setClaimError] = useState<string | null>(null)

  const { mutate: claim, isPending } = useMutation({
    mutationFn: () => claimCampaign(campaign.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['review-queue'] })
      void navigate(`/review/${campaign.id}`)
    },
    onError: () => {
      setClaimError('Failed to claim campaign. Please try again.')
    },
  })

  const submittedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(campaign.createdAt)

  return (
    <tr>
      <td style={tdStyle}>{campaign.title}</td>
      <td style={tdStyle}>{submittedDate}</td>
      <td style={tdStyle}>
        {claimError && (
          <span
            role="alert"
            style={{
              fontSize: 'var(--type-body-small-size)',
              color: 'var(--color-status-error)',
              marginRight: 'var(--space-2)',
            }}
          >
            {claimError}
          </span>
        )}
        <button
          style={isPending ? claimButtonDisabledStyle : claimButtonStyle}
          disabled={isPending}
          onClick={() => {
            setClaimError(null)
            claim()
          }}
          aria-label={`Claim campaign: ${campaign.title}`}
        >
          {isPending ? 'Claiming…' : 'Claim'}
        </button>
      </td>
    </tr>
  )
}

export function ReviewQueuePage() {
  const {
    data: campaigns,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['review-queue'],
    queryFn: fetchReviewQueue,
  })

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle} role="status" aria-busy="true">
          Loading review queue…
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle} role="alert">
          Failed to load review queue. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <h1 style={headingStyle}>Review Queue</h1>
        <p style={subheadingStyle}>Campaigns awaiting review, oldest first.</p>

        {campaigns && campaigns.length === 0 && (
          <div style={emptyStyle}>No campaigns awaiting review.</div>
        )}

        {campaigns && campaigns.length > 0 && (
          <table style={tableStyle} aria-label="Campaigns awaiting review">
            <thead>
              <tr>
                <th style={thStyle}>Campaign</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <CampaignRow key={campaign.id} campaign={campaign} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
