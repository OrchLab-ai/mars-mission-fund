import { type CampaignDetail } from '../../api/campaigns'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'

interface FundingProgressSectionProps {
  campaign: CampaignDetail
  className?: string
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US')
}

function getTimeRemaining(deadline: Date | null): string {
  if (!deadline) return 'No deadline'
  const now = Date.now()
  const end = deadline.getTime()
  const diffMs = end - now
  if (diffMs <= 0) return 'Ended'
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return `${days} day${days === 1 ? '' : 's'} remaining`
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
}

const amountsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
}

const raisedStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-stat-value-size)',
  fontWeight: 'var(--type-stat-value-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-stat-value-spacing)',
  lineHeight: 'var(--type-stat-value-leading)',
  color: 'var(--color-text-accent)',
}

const targetStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-4)',
}

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
}

const statValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-data)',
  fontSize: 'var(--type-stat-value-compact-size)',
  fontWeight: 'var(--type-stat-value-compact-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-stat-value-compact-spacing)',
  lineHeight: 'var(--type-stat-value-compact-leading)',
  color: 'var(--color-text-primary)',
}

const statLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-data)',
  fontSize: 'var(--type-label-size)',
  fontWeight: 'var(--type-label-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-label-spacing)',
  lineHeight: 'var(--type-label-leading)',
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
}

const percentageStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
  textAlign: 'right',
}

export function FundingProgressSection({ campaign, className }: FundingProgressSectionProps) {
  const percentage = Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100)
  const isComplete = percentage >= 100

  return (
    <div style={sectionStyle} className={className}>
      <div style={amountsStyle}>
        <span style={raisedStyle}>{formatCurrency(campaign.raisedAmount)}</span>
        <span style={targetStyle}>raised of {formatCurrency(campaign.goalAmount)} goal</span>
      </div>

      <div>
        <ProgressBar
          value={percentage}
          complete={isComplete}
          label={`Funding progress: ${Math.round(percentage)}%`}
        />
        <p style={percentageStyle}>{Math.round(percentage)}% funded</p>
      </div>

      <div style={statsGridStyle}>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{campaign.contributorCount.toLocaleString('en-US')}</span>
          <span style={statLabelStyle}>Contributors</span>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{getTimeRemaining(campaign.deadline)}</span>
          <span style={statLabelStyle}>Time Left</span>
        </div>
      </div>

      <Button variant="primary" href={'/contribute/' + campaign.id}>
        Contribute Now
      </Button>
    </div>
  )
}
