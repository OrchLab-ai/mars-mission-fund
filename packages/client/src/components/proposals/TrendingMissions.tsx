import type { ProposalSummary } from '../../api/proposals'
import { ProposalCard } from './ProposalCard'

const TRENDING_LIMIT = 3

const sectionStyle: React.CSSProperties = {
  marginBottom: '48px',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--type-hero)',
  fontSize: '24px',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: '16px',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '24px',
}

export function getTrendingProposals(proposals: ProposalSummary[]): ProposalSummary[] {
  return proposals
    .filter((p) => p.status === 'Live')
    .sort((a, b) => b.contributorCount - a.contributorCount)
    .slice(0, TRENDING_LIMIT)
}

interface TrendingMissionsProps {
  proposals: ProposalSummary[]
}

export function TrendingMissions({ proposals }: TrendingMissionsProps) {
  const trending = getTrendingProposals(proposals)
  if (trending.length === 0) return null

  return (
    <section style={sectionStyle} aria-labelledby="trending-missions-heading">
      <h2 id="trending-missions-heading" style={headingStyle}>
        Trending Missions
      </h2>
      <div className="mmf-proposals-grid" style={gridStyle} aria-label="Trending missions">
        {trending.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </section>
  )
}
