import { Navigate, useParams } from 'react-router'
import { useProposal } from '../hooks/useProposal'
import { useAuthContext } from '../context/AuthContext'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { FundingProgressSection } from '../components/proposals/FundingProgressSection'
import { MilestonesSection } from '../components/proposals/MilestonesSection'
import { StretchGoalsSection } from '../components/proposals/StretchGoalsSection'
import { ProposalUpdatesSection } from '../components/proposals/ProposalUpdatesSection'
import { TeamSection } from '../components/proposals/TeamSection'
import { ReviewActionsPanel } from '../components/proposals/ReviewActionsPanel'
import type { ProposalStatus } from '@mmf/shared'

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

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
}

const contentStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: 'var(--space-8) var(--space-6)',
}

const headerStyle: React.CSSProperties = {
  marginBottom: 'var(--space-8)',
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
  fontSize: 'var(--type-heading-1-size)',
  fontWeight: 'var(--type-heading-1-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-heading-1-spacing)',
  lineHeight: 'var(--type-heading-1-leading)',
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

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()
  const { data: proposal, isLoading, isError } = useProposal(id ?? '')

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle} role="status" aria-busy="true">
          Loading proposal…
        </div>
      </div>
    )
  }

  if (isError || !proposal) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle} role="alert">
          Failed to load proposal. Please try again.
        </div>
      </div>
    )
  }

  if (proposal.reviewerId !== user?.id) {
    return <Navigate to="/review" replace />
  }

  return (
    <>
      <style>{`
        .review-detail-layout {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }
        @media (min-width: 1024px) {
          .review-detail-layout {
            flex-direction: row;
            align-items: flex-start;
          }
          .review-detail-main {
            flex: 65;
          }
          .review-detail-sidebar {
            flex: 35;
            position: sticky;
            top: var(--space-8);
          }
        }
      `}</style>
      <div style={pageStyle}>
        <div style={contentStyle}>
          <div style={headerStyle}>
            <div style={titleRowStyle}>
              <h1 style={titleStyle}>{proposal.title}</h1>
              <Badge variant={statusBadgeVariant[proposal.status]}>{proposal.status}</Badge>
            </div>
            <span style={categoryStyle}>{proposal.category}</span>
          </div>

          <div className="review-detail-layout">
            <div className="review-detail-main">
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
            </div>

            <div className="review-detail-sidebar">
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
