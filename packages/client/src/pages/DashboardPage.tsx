import { Link, useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCreatorCampaigns } from '../hooks/useCreatorCampaigns'
import {
  deleteCampaign,
  submitCampaignForReview,
  launchCampaign,
  resubmitCampaign,
  cancelCampaign,
} from '../api/campaigns'
import { Badge } from '../components/ui/Badge'
import type { CampaignSummary } from '../api/campaigns'
import type { CampaignStatus } from '@mmf/shared'

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

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 'var(--space-6)',
}

const newCampaignLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'var(--color-accent-primary)',
  color: 'var(--color-text-on-accent)',
  textDecoration: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-5)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-3-size)',
  fontWeight: 'var(--type-heading-3-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-3)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-8)',
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

const actionButtonStyle: React.CSSProperties = {
  background: 'var(--color-accent-primary)',
  color: 'var(--color-text-on-accent)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  cursor: 'pointer',
  marginRight: 'var(--space-2)',
}

const dangerButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: 'var(--color-status-error-bg)',
  color: 'var(--color-status-error)',
  border: '1px solid var(--color-status-error-border)',
}

const linkButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: 'transparent',
  color: 'var(--color-accent-primary)',
  border: '1px solid var(--color-accent-primary)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
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

type BadgeVariant = 'funded' | 'active' | 'new' | 'accent'

function statusBadgeVariant(status: CampaignStatus): BadgeVariant {
  switch (status) {
    case 'Live':
    case 'Funded':
      return 'funded'
    case 'Draft':
      return 'new'
    case 'Submitted':
    case 'Under Review':
    case 'Approved':
      return 'active'
    default:
      return 'accent'
  }
}

function formatDeadline(deadline: Date | null): string {
  if (!deadline) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(deadline)
}

function formatRaised(raisedAmount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(raisedAmount)
}

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: submitForReview, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitCampaignForReview(campaign.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-campaigns'] })
    },
  })

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteCampaign(campaign.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-campaigns'] })
    },
  })

  const { mutate: launch, isPending: isLaunching } = useMutation({
    mutationFn: () => launchCampaign(campaign.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-campaigns'] })
    },
  })

  const { mutate: revise, isPending: isRevising } = useMutation({
    mutationFn: () => resubmitCampaign(campaign.id),
    onSuccess: () => {
      void navigate(`/campaigns/${campaign.id}/edit`)
    },
  })

  const { mutate: doCancel, isPending: isCancelling } = useMutation({
    mutationFn: () => cancelCampaign(campaign.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-campaigns'] })
    },
  })

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${campaign.title}"?`)) {
      doDelete()
    }
  }

  function handleCancel() {
    if (window.confirm('Are you sure you want to request cancellation?')) {
      doCancel()
    }
  }

  const status = campaign.status

  return (
    <tr>
      <td style={tdStyle}>{campaign.title}</td>
      <td style={tdStyle}>
        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
      </td>
      <td style={tdStyle}>{formatDeadline(campaign.deadline)}</td>
      <td style={tdStyle}>{formatRaised(campaign.raisedAmount)}</td>
      <td style={tdStyle}>
        {status === 'Draft' && (
          <>
            <Link to={`/campaigns/${campaign.id}/edit`} style={linkButtonStyle}>
              Edit
            </Link>
            <button
              style={actionButtonStyle}
              disabled={isSubmitting}
              onClick={() => submitForReview()}
              aria-label={`Submit ${campaign.title} for review`}
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              style={dangerButtonStyle}
              disabled={isDeleting}
              onClick={handleDelete}
              aria-label={`Delete ${campaign.title}`}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        )}
        {status === 'Approved' && (
          <>
            <button
              style={actionButtonStyle}
              disabled={isLaunching}
              onClick={() => launch()}
              aria-label={`Launch ${campaign.title}`}
            >
              {isLaunching ? 'Launching…' : 'Launch'}
            </button>
            <Link to={`/campaigns/${campaign.id}/edit`} style={linkButtonStyle}>
              Edit
            </Link>
          </>
        )}
        {(status === 'Live' || status === 'Funded') && (
          <>
            <Link to={`/campaigns/${campaign.id}`} style={linkButtonStyle}>
              View
            </Link>
            <button
              style={dangerButtonStyle}
              disabled={isCancelling}
              onClick={handleCancel}
              aria-label={`Cancel ${campaign.title}`}
            >
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          </>
        )}
        {status === 'Rejected' && (
          <button
            style={actionButtonStyle}
            disabled={isRevising}
            onClick={() => revise()}
            aria-label={`Revise ${campaign.title}`}
          >
            {isRevising ? 'Loading…' : 'Revise'}
          </button>
        )}
        {(status === 'Settlement' ||
          status === 'Complete' ||
          status === 'Cancelled' ||
          status === 'Failed' ||
          status === 'Suspended') && (
          <Link to={`/campaigns/${campaign.id}`} style={linkButtonStyle}>
            View
          </Link>
        )}
      </td>
    </tr>
  )
}

type StatusGroup = {
  label: string
  statuses: CampaignStatus[]
}

const STATUS_GROUPS: StatusGroup[] = [
  { label: 'Draft', statuses: ['Draft'] },
  {
    label: 'In Review / Approved',
    statuses: ['Submitted', 'Under Review', 'Approved'],
  },
  { label: 'Active', statuses: ['Live', 'Funded'] },
  { label: 'Settlement / Complete', statuses: ['Settlement', 'Complete'] },
  {
    label: 'Rejected / Cancelled / Failed',
    statuses: ['Rejected', 'Cancelled', 'Failed', 'Suspended'],
  },
]

function CampaignSection({ label, campaigns }: { label: string; campaigns: CampaignSummary[] }) {
  if (campaigns.length === 0) return null

  return (
    <section>
      <h2 style={sectionHeadingStyle}>{label}</h2>
      <table style={tableStyle} aria-label={`${label} campaigns`}>
        <thead>
          <tr>
            <th style={thStyle}>Campaign</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Deadline</th>
            <th style={thStyle}>Raised</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function DashboardPage() {
  const { data: campaigns, isLoading, isError } = useCreatorCampaigns()

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle} role="status" aria-busy="true">
          Loading your campaigns…
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle} role="alert">
          Failed to load your campaigns. Please try again.
        </div>
      </div>
    )
  }

  const isEmpty = !campaigns || campaigns.length === 0

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <div style={headerRowStyle}>
          <h1 style={headingStyle}>Creator Dashboard</h1>
          <Link to="/campaigns/new" style={newCampaignLinkStyle}>
            + New Campaign
          </Link>
        </div>

        {isEmpty && (
          <div style={emptyStyle}>
            <p>You have no campaigns yet.</p>
            <p>
              <Link to="/campaigns/new" style={{ color: 'var(--color-accent-primary)' }}>
                Create your first campaign
              </Link>
            </p>
          </div>
        )}

        {!isEmpty &&
          STATUS_GROUPS.map(({ label, statuses }) => {
            const group = campaigns!.filter((c) => statuses.includes(c.status))
            return <CampaignSection key={label} label={label} campaigns={group} />
          })}
      </div>
    </div>
  )
}
