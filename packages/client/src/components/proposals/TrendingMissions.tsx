import { useTrendingProposals } from '../../hooks/useTrendingProposals'
import { ProposalCard } from './ProposalCard'

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

export function TrendingMissions() {
  const { data: proposals } = useTrendingProposals()

  if (!proposals || proposals.length === 0) return null

  return (
    <section style={sectionStyle} aria-labelledby="trending-missions-heading">
      <h2 id="trending-missions-heading" style={headingStyle}>
        Trending Missions
      </h2>
      <div className="mmf-proposals-grid" style={gridStyle} aria-label="Trending missions">
        {proposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} showContributors />
        ))}
      </div>
    </section>
  )
}
