import { Link, useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCreatorProposals } from '../hooks/useCreatorProposals'
import {
  deleteProposal,
  submitProposalForReview,
  launchProposal,
  resubmitProposal,
  cancelProposal,
} from '../api/proposals'
import { Badge } from '../components/ui/Badge'
import type { ProposalSummary } from '../api/proposals'
import type { ProposalStatus } from '@mmf/shared'

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

const newProposalLinkStyle: React.CSSProperties = {
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

function statusBadgeVariant(status: ProposalStatus): BadgeVariant {
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

function ProposalRow({ proposal }: { proposal: ProposalSummary }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: submitForReview, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitProposalForReview(proposal.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-proposals'] })
    },
  })

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteProposal(proposal.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-proposals'] })
    },
  })

  const { mutate: launch, isPending: isLaunching } = useMutation({
    mutationFn: () => launchProposal(proposal.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-proposals'] })
    },
  })

  const { mutate: revise, isPending: isRevising } = useMutation({
    mutationFn: () => resubmitProposal(proposal.id),
    onSuccess: () => {
      void navigate(`/proposals/${proposal.id}/edit`)
    },
  })

  const { mutate: doCancel, isPending: isCancelling } = useMutation({
    mutationFn: () => cancelProposal(proposal.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-proposals'] })
    },
  })

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${proposal.title}"?`)) {
      doDelete()
    }
  }

  function handleCancel() {
    if (window.confirm('Are you sure you want to request cancellation?')) {
      doCancel()
    }
  }

  const status = proposal.status

  return (
    <tr>
      <td style={tdStyle}>{proposal.title}</td>
      <td style={tdStyle}>
        <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
      </td>
      <td style={tdStyle}>{formatDeadline(proposal.deadline)}</td>
      <td style={tdStyle}>{formatRaised(proposal.raisedAmount)}</td>
      <td style={tdStyle}>
        {status === 'Draft' && (
          <>
            <Link to={`/proposals/${proposal.id}/edit`} style={linkButtonStyle}>
              Edit
            </Link>
            <button
              style={actionButtonStyle}
              disabled={isSubmitting}
              onClick={() => submitForReview()}
              aria-label={`Submit ${proposal.title} for review`}
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              style={dangerButtonStyle}
              disabled={isDeleting}
              onClick={handleDelete}
              aria-label={`Delete ${proposal.title}`}
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
              aria-label={`Launch ${proposal.title}`}
            >
              {isLaunching ? 'Launching…' : 'Launch'}
            </button>
            <Link to={`/proposals/${proposal.id}/edit`} style={linkButtonStyle}>
              Edit
            </Link>
          </>
        )}
        {(status === 'Live' || status === 'Funded') && (
          <>
            <Link to={`/proposals/${proposal.id}`} style={linkButtonStyle}>
              View
            </Link>
            <button
              style={dangerButtonStyle}
              disabled={isCancelling}
              onClick={handleCancel}
              aria-label={`Cancel ${proposal.title}`}
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
            aria-label={`Revise ${proposal.title}`}
          >
            {isRevising ? 'Loading…' : 'Revise'}
          </button>
        )}
        {(status === 'Settlement' ||
          status === 'Complete' ||
          status === 'Cancelled' ||
          status === 'Failed' ||
          status === 'Suspended') && (
          <Link to={`/proposals/${proposal.id}`} style={linkButtonStyle}>
            View
          </Link>
        )}
      </td>
    </tr>
  )
}

type StatusGroup = {
  label: string
  statuses: ProposalStatus[]
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

function ProposalSection({ label, proposals }: { label: string; proposals: ProposalSummary[] }) {
  if (proposals.length === 0) return null

  return (
    <section>
      <h2 style={sectionHeadingStyle}>{label}</h2>
      <table style={tableStyle} aria-label={`${label} proposals`}>
        <thead>
          <tr>
            <th style={thStyle}>Proposal</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Deadline</th>
            <th style={thStyle}>Raised</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <ProposalRow key={proposal.id} proposal={proposal} />
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function DashboardPage() {
  const { data: proposals, isLoading, isError } = useCreatorProposals()

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle} role="status" aria-busy="true">
          Loading your proposals…
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle} role="alert">
          Failed to load your proposals. Please try again.
        </div>
      </div>
    )
  }

  const isEmpty = !proposals || proposals.length === 0

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <div style={headerRowStyle}>
          <h1 style={headingStyle}>Creator Dashboard</h1>
          <Link to="/proposals/new" style={newProposalLinkStyle}>
            + New Proposal
          </Link>
        </div>

        {isEmpty && (
          <div style={emptyStyle}>
            <p>You have no proposals yet.</p>
            <p>
              <Link to="/proposals/new" style={{ color: 'var(--color-accent-primary)' }}>
                Create your first proposal
              </Link>
            </p>
          </div>
        )}

        {!isEmpty &&
          STATUS_GROUPS.map(({ label, statuses }) => {
            const group = proposals!.filter((c) => statuses.includes(c.status))
            return <ProposalSection key={label} label={label} proposals={group} />
          })}
      </div>
    </div>
  )
}
