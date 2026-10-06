import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { ProgressBar } from './ui/ProgressBar'
import { Button } from './ui/Button'

interface MissionCardProps {
  title: string
  description: string
  badge: string
  progress: number
  raised: string
  goal: string
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--type-card-title)',
  color: 'var(--color-text-primary)',
  margin: '12px 0 8px',
  fontSize: 'var(--type-card-title-size)',
  fontWeight: 700,
  lineHeight: 1.3,
}

const descriptionStyle: React.CSSProperties = {
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

export function MissionCard({
  title,
  description,
  badge,
  progress,
  raised,
  goal,
}: MissionCardProps) {
  return (
    <Card accent>
      <Badge variant="active">{badge}</Badge>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descriptionStyle}>{description}</p>
      <ProgressBar value={progress} label={`${title} funding progress: ${progress}% funded`} />
      <p style={fundingStatusStyle}>
        Raised {raised} of {goal}
      </p>
      <Button variant="ghost" href="/campaigns">
        View Mission
      </Button>
    </Card>
  )
}
