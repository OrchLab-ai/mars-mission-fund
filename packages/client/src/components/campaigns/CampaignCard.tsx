import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { Button } from '../ui/Button'
import type { CampaignSummary } from '../../api/campaigns'

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--type-card-title)',
  color: 'var(--color-text-primary)',
  margin: '12px 0 8px',
  fontSize: 'var(--type-card-title-size)',
  fontWeight: 700,
  lineHeight: 1.3,
}

const summaryStyle: React.CSSProperties = {
  fontFamily: 'var(--type-body)',
  color: 'var(--color-text-secondary)',
  fontSize: '14px',
  lineHeight: 1.6,
  margin: '0 0 16px',
}

const fundingStatusStyle: React.CSSProperties = {
  fontFamily: 'var(--type-data)',
  color: 'var(--color-text-tertiary)',
  fontSize: '12px',
  margin: '8px 0 16px',
}

const timeRemainingStyle: React.CSSProperties = {
  fontFamily: 'var(--type-data)',
  color: 'var(--color-text-tertiary)',
  fontSize: '12px',
  margin: '0 0 16px',
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getTimeRemaining(deadline: Date | null): string {
  if (!deadline) return 'No deadline'
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  if (diffMs <= 0) return 'Ended'
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return `${diffDays} day${diffDays === 1 ? '' : 's'} left`
}

function truncateSummary(summary: string, maxLength = 120): string {
  if (summary.length <= maxLength) return summary
  return summary.slice(0, maxLength) + '…'
}

interface CampaignCardProps {
  campaign: CampaignSummary
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const excerpt = truncateSummary(campaign.summary)
  const raised = formatUSD(campaign.raisedAmount)
  const goal = formatUSD(campaign.goalAmount)
  const fundingPct = Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100)
  const timeRemaining = getTimeRemaining(campaign.deadline)

  return (
    <Card accent>
      <Badge variant="active">{campaign.category}</Badge>
      <h3 style={titleStyle}>{campaign.title}</h3>
      <p style={summaryStyle}>{excerpt}</p>
      <ProgressBar
        value={fundingPct}
        complete={fundingPct >= 100}
        label={`${campaign.title} funding progress: ${Math.round(fundingPct)}% funded`}
      />
      <p style={fundingStatusStyle}>
        Raised {raised} of {goal}
      </p>
      <p style={timeRemainingStyle}>{timeRemaining}</p>
      <Button variant="ghost" href={`/campaigns/${campaign.id}`}>
        View Mission
      </Button>
    </Card>
  )
}
