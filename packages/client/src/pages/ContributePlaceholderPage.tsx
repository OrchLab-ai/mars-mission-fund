import { useParams } from 'react-router'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-6)',
}

const cardContentStyle: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '480px',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-hero-heading-size)',
  fontWeight: 'var(--type-hero-heading-weight)' as React.CSSProperties['fontWeight'],
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-4)',
}

const messageStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  lineHeight: 'var(--type-body-leading)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--space-8)',
}

export function ContributePlaceholderPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div style={pageStyle}>
      <Card>
        <div style={cardContentStyle}>
          <h1 style={headingStyle}>Coming Soon</h1>
          <p style={messageStyle}>
            The contribution flow is currently in development. Check back soon to support this
            campaign.
          </p>
          <Button variant="ghost" href={'/campaigns/' + id}>
            Back to Campaign
          </Button>
        </div>
      </Card>
    </div>
  )
}
