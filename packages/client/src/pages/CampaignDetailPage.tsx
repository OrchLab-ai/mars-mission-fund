import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCampaign } from '../hooks/useCampaign'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FundingProgressSection } from '../components/campaigns/FundingProgressSection'
import { MilestonesSection } from '../components/campaigns/MilestonesSection'
import { StretchGoalsSection } from '../components/campaigns/StretchGoalsSection'
import { TeamSection } from '../components/campaigns/TeamSection'
import { ReviewActionsPanel } from '../components/campaigns/ReviewActionsPanel'
import { AdminActionsPanel } from '../components/campaigns/AdminActionsPanel'
import { useAuthContext } from '../context/AuthContext'
import { submitMilestoneEvidence } from '../api/campaigns'
import type { CampaignStatus, Milestone } from '@mmf/shared'

type BadgeVariant = 'funded' | 'active' | 'new'

const statusBadgeVariant: Record<CampaignStatus, BadgeVariant> = {
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

const statusLabel: Record<CampaignStatus, string> = {
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
  background: 'var(--gradient-campaign-hero)',
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

function MilestoneEvidenceForm({
  campaignId,
  milestone,
}: {
  campaignId: string
  milestone: Milestone
}) {
  const queryClient = useQueryClient()
  const [evidenceDescription, setEvidenceDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () =>
      submitMilestoneEvidence(campaignId, milestone.id, {
        evidenceDescription,
        evidenceUrl: evidenceUrl.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
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
  campaignId,
  milestones,
}: {
  campaignId: string
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
        <MilestoneEvidenceForm key={milestone.id} campaignId={campaignId} milestone={milestone} />
      ))}
    </div>
  )
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()

  const { data: campaign, isLoading, isError } = useCampaign(id ?? '')

  useEffect(() => {
    if (campaign) {
      document.title = `${campaign.title} — Mars Mission Fund`
    }
  }, [campaign])

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>Loading campaign…</div>
      </div>
    )
  }

  if (isError || !campaign) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>Failed to load campaign. Please try again.</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .campaign-layout {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }
        @media (min-width: 1024px) {
          .campaign-layout {
            flex-direction: row;
            align-items: flex-start;
          }
          .campaign-main {
            flex: 65;
          }
          .campaign-sidebar {
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
          {campaign.heroImageUrl && (
            <img
              src={campaign.heroImageUrl}
              alt={`${campaign.title} hero image`}
              style={heroImgStyle}
            />
          )}
          <div style={heroOverlayStyle} />
        </div>

        {/* Title / meta */}
        <div style={headerStyle}>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>{campaign.title}</h1>
            <Badge variant={statusBadgeVariant[campaign.status]}>
              {statusLabel[campaign.status]}
            </Badge>
          </div>
          <span style={categoryStyle}>{campaign.category}</span>
        </div>

        {/* Two-column content */}
        <div style={contentStyle}>
          <div className="campaign-layout">
            {/* Main column */}
            <div className="campaign-main">
              <Card>
                <div
                  style={descriptionStyle}
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              </Card>

              <div style={sectionSpacingStyle}>
                <TeamSection teamMembers={campaign.teamMembers} />
              </div>

              <div style={sectionSpacingStyle}>
                <MilestonesSection milestones={campaign.milestones} />
              </div>

              <div style={sectionSpacingStyle}>
                <StretchGoalsSection stretchGoals={campaign.stretchGoals} />
              </div>

              <div style={sectionSpacingStyle}>
                <ReviewActionsPanel campaign={campaign} user={user} />
              </div>

              {(user?.role === 'Administrator' || user?.role === 'SuperAdministrator') && (
                <div style={sectionSpacingStyle}>
                  <AdminActionsPanel campaign={campaign} user={user} />
                </div>
              )}

              {user?.id === campaign.creatorId && campaign.status === 'Settlement' && (
                <div style={sectionSpacingStyle}>
                  <SubmitEvidencePanel campaignId={campaign.id} milestones={campaign.milestones} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="campaign-sidebar">
              <Card accent>
                <FundingProgressSection campaign={campaign} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
