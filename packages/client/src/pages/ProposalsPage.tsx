import { useSearchParams } from 'react-router'
import { useProposals } from '../hooks/useProposals'
import type { ProposalFilterParams } from '../api/proposals'
import { ProposalCard } from '../components/proposals/ProposalCard'
import { ProposalFilters } from '../components/proposals/ProposalFilters'

const pageStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '48px 24px',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--type-hero)',
  fontSize: '32px',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: '8px',
}

const subheadingStyle: React.CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '16px',
  color: 'var(--color-text-secondary)',
  marginBottom: '40px',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '24px',
}

const statusStyle: React.CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '16px',
  color: 'var(--color-text-secondary)',
  padding: '48px 0',
  textAlign: 'center',
}

const resultCountStyle: React.CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  marginBottom: '16px',
}

const cssOverrides = `
  .mmf-proposals-grid {
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .mmf-proposals-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .mmf-proposals-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`

let proposalsStyleInjected = false
function ensureProposalsStyle() {
  if (proposalsStyleInjected || typeof document === 'undefined') return
  proposalsStyleInjected = true
  const el = document.createElement('style')
  el.textContent = cssOverrides
  document.head.appendChild(el)
}

function filtersFromParams(params: URLSearchParams): ProposalFilterParams {
  const search = params.get('search') || undefined
  const cats = params.get('categories')
  const categories = cats ? cats.split(',').filter(Boolean) : undefined
  return {
    search,
    categories: categories && categories.length > 0 ? categories : undefined,
  }
}

export function ProposalsPage() {
  ensureProposalsStyle()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = filtersFromParams(searchParams)
  const { data: proposals, isLoading, isError } = useProposals(filters)

  function handleFiltersChange(f: ProposalFilterParams) {
    const next = new URLSearchParams()
    if (f.search) next.set('search', f.search)
    if (f.categories && f.categories.length > 0) next.set('categories', f.categories.join(','))
    setSearchParams(next, { replace: true })
  }

  return (
    <section style={pageStyle}>
      <h1 style={headingStyle}>Explore Missions</h1>
      <p style={subheadingStyle}>Support the missions driving humanity toward Mars.</p>

      <ProposalFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {isLoading && (
        <p style={resultCountStyle} aria-live="polite">
          Loading…
        </p>
      )}

      {isError && (
        <div role="alert" style={statusStyle}>
          We couldn&apos;t load missions right now. Please try again later.
        </div>
      )}

      {proposals && (
        <>
          <p style={resultCountStyle} aria-live="polite">
            {proposals.length} mission{proposals.length !== 1 ? 's' : ''} found
          </p>
          <div className="mmf-proposals-grid" style={gridStyle} aria-label="Proposal listings">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
