import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProposal } from '../hooks/useProposal'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FundingProgressSection } from '../components/proposals/FundingProgressSection'
import { MilestonesSection } from '../components/proposals/MilestonesSection'
import { StretchGoalsSection } from '../components/proposals/StretchGoalsSection'
import { ProposalUpdatesSection } from '../components/proposals/ProposalUpdatesSection'
import { TeamSection } from '../components/proposals/TeamSection'
import { ReviewActionsPanel } from '../components/proposals/ReviewActionsPanel'
import { AdminActionsPanel } from '../components/proposals/AdminActionsPanel'
import { useAuthContext } from '../context/AuthContext'
import { postProposalUpdate, submitMilestoneEvidence } from '../api/proposals'
import type { ProposalStatus, Milestone } from '@mmf/shared'

type BadgeVariant = 'funded' | 'active' | 'new'

const statusBadgeVariant: Record<ProposalStatus, BadgeVariant> = {
  Complete: 'funded',
  Funded: 'funded',
  Live: 'active',
  Approved: 'active',
  'Under Review': 'active',
  Submitted: 'active',
  Draft: 'new',
  Rejected: 'new',
  Failed: 'new',
  Suspended: 'new',
  Settlement: 'new',
  Cancelled: 'new',
}

const statusLabel: Record<ProposalStatus, string> = {
  Complete: 'Complete',
  Funded: 'Funded',
  Live: 'Live',
  Approved: 'Approved',
  'Under Review': 'Under Review',
  Submitted: 'Submitted',
  Draft: 'Draft',
  Rejected: 'Rejected',
  Failed: 'Failed',
  Suspended: 'Suspended',
  Settlement: 'Settlement',
  Cancelled: 'Cancelled',
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
}

const heroWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '400px',
  overflow: 'hidden',
}

const heroBgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'var(--gradient-proposal-hero)',
}

const heroOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)',
}

const heroImgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const headerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: 'var(--space-8) var(--space-6)',
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-2)',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-hero-heading-size)',
  fontWeight: 'var(--type-hero-heading-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-hero-heading-spacing)',
  lineHeight: 'var(--type-hero-heading-leading)',
  color: 'var(--color-text-primary)',
  margin: 0,
}

const categoryStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-tertiary)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const contentStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 var(--space-6) var(--space-16)',
}

const descriptionStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  lineHeight: 'var(--type-body-leading)',
  color: 'var(--color-text-secondary)',
  margin: 0,
}

const sectionSpacingStyle: React.CSSProperties = {
  marginTop: 'var(--space-10)',
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

const creatorPanelStyle: React.CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-6)',
  background: 'var(--color-bg-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
}

const creatorPanelHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-3-size)',
  fontWeight: 'var(--type-heading-3-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-heading-3-spacing)',
  lineHeight: 'var(--type-heading-3-leading)',
  color: 'var(--color-text-primary)',
  margin: 0,
}

const creatorPanelLabelStyle: React.CSSProperties = {
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

const creatorPanelTextareaStyle: React.CSSProperties = {
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

const creatorPanelInputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-3)',
  width: '100%',
  boxSizing: 'border-box',
}

const creatorPanelErrorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-status-error)',
}

const milestoneItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  paddingTop: 'var(--space-4)',
  borderTop: '1px solid var(--color-border-subtle)',
}

const milestoneTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-1)',
}

function PostUpdatePanel({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => postProposalUpdate(proposalId, body),
    onSuccess: () => {
      setBody('')
      void queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] })
    },
    onError: () => {
      setError('Failed to post update. Please try again.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutate()
  }

  return (
    <div style={creatorPanelStyle} aria-label="Post update">
      <h2 style={creatorPanelHeadingStyle}>Post an Update</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <label style={creatorPanelLabelStyle}>
          Update
          <textarea
            style={creatorPanelTextareaStyle}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share news with your backers…"
            required
          />
        </label>
        {error && (
          <span role="alert" style={creatorPanelErrorStyle}>
            {error}
          </span>
        )}
        <Button type="submit" variant="primary" disabled={isPending || body.trim() === ''}>
          {isPending ? 'Posting…' : 'Post Update'}
        </Button>
      </form>
    </div>
  )
}

function MilestoneEvidenceForm({
  proposalId,
  milestone,
}: {
  proposalId: string
  milestone: Milestone
}) {
  const queryClient = useQueryClient()
  const [evidenceDescription, setEvidenceDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () =>
      submitMilestoneEvidence(proposalId, milestone.id, {
        evidenceDescription,
        evidenceUrl: evidenceUrl.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] })
    },
    onError: () => {
      setError('Failed to submit evidence. Please try again.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutate()
  }

  return (
    <div style={milestoneItemStyle}>
      <p style={milestoneTitleStyle}>{milestone.title}</p>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      >
        <label style={creatorPanelLabelStyle}>
          Evidence Description
          <textarea
            style={creatorPanelTextareaStyle}
            value={evidenceDescription}
            onChange={(e) => setEvidenceDescription(e.target.value)}
            placeholder="Describe the evidence for this milestone…"
            required
          />
        </label>
        <label style={creatorPanelLabelStyle}>
          Evidence URL (optional)
          <input
            type="url"
            style={creatorPanelInputStyle}
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        {error && (
          <span role="alert" style={creatorPanelErrorStyle}>
            {error}
          </span>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isPending || isSuccess || evidenceDescription.trim() === ''}
        >
          {isPending ? 'Submitting…' : isSuccess ? 'Submitted' : 'Submit Evidence'}
        </Button>
      </form>
    </div>
  )
}

function SubmitEvidencePanel({
  proposalId,
  milestones,
}: {
  proposalId: string
  milestones: Milestone[]
}) {
  const pendingMilestones = milestones.filter(
    (m) => m.status === 'Pending' || m.status === 'Returned'
  )

  if (pendingMilestones.length === 0) return null

  return (
    <div style={creatorPanelStyle} aria-label="Submit milestone evidence">
      <h2 style={creatorPanelHeadingStyle}>Submit Milestone Evidence</h2>
      {pendingMilestones.map((milestone) => (
        <MilestoneEvidenceForm key={milestone.id} proposalId={proposalId} milestone={milestone} />
      ))}
    </div>
  )
}

export function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()

  const { data: proposal, isLoading, isError } = useProposal(id ?? '')

  useEffect(() => {
    if (proposal) {
      document.title = `${proposal.title} — Mars Mission Fund`
    }
  }, [proposal])

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>Loading proposal…</div>
      </div>
    )
  }

  if (isError || !proposal) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>Failed to load proposal. Please try again.</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .proposal-layout {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }
        @media (min-width: 1024px) {
          .proposal-layout {
            flex-direction: row;
            align-items: flex-start;
          }
          .proposal-main {
            flex: 65;
          }
          .proposal-sidebar {
            flex: 35;
            position: sticky;
            top: var(--space-8);
          }
        }
      `}</style>
      <div style={pageStyle}>
        {/* Hero */}
        <div style={heroWrapperStyle}>
          <div style={heroBgStyle} />
          {proposal.heroImageUrl && (
            <img
              src={proposal.heroImageUrl}
              alt={`${proposal.title} hero image`}
              style={heroImgStyle}
            />
          )}
          <div style={heroOverlayStyle} />
        </div>

        {/* Title / meta */}
        <div style={headerStyle}>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>{proposal.title}</h1>
            <Badge variant={statusBadgeVariant[proposal.status]}>
              {statusLabel[proposal.status]}
            </Badge>
          </div>
          <span style={categoryStyle}>{proposal.category}</span>
        </div>

        {/* Two-column content */}
        <div style={contentStyle}>
          <div className="proposal-layout">
            {/* Main column */}
            <div className="proposal-main">
              <Card>
                <div
                  style={descriptionStyle}
                  dangerouslySetInnerHTML={{ __html: proposal.description }}
                />
              </Card>

              <div style={sectionSpacingStyle}>
                <TeamSection teamMembers={proposal.teamMembers} />
              </div>

              <div style={sectionSpacingStyle}>
                <MilestonesSection milestones={proposal.milestones} />
              </div>

              <div style={sectionSpacingStyle}>
                <StretchGoalsSection stretchGoals={proposal.stretchGoals} />
              </div>

              <div style={sectionSpacingStyle}>
                <ProposalUpdatesSection updates={proposal.updates} />
              </div>

              <div style={sectionSpacingStyle}>
                <ReviewActionsPanel proposal={proposal} user={user} />
              </div>

              {(user?.role === 'Administrator' || user?.role === 'SuperAdministrator') && (
                <div style={sectionSpacingStyle}>
                  <AdminActionsPanel proposal={proposal} user={user} />
                </div>
              )}

              {user?.id === proposal.creatorId &&
                (proposal.status === 'Live' || proposal.status === 'Funded') && (
                  <div style={sectionSpacingStyle}>
                    <PostUpdatePanel proposalId={proposal.id} />
                  </div>
                )}

              {user?.id === proposal.creatorId && proposal.status === 'Settlement' && (
                <div style={sectionSpacingStyle}>
                  <SubmitEvidencePanel proposalId={proposal.id} milestones={proposal.milestones} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="proposal-sidebar">
              <Card accent>
                <FundingProgressSection proposal={proposal} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
