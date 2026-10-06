import { useSearchParams } from 'react-router'
import { useCampaigns } from '../hooks/useCampaigns'
import type { CampaignFilterParams } from '../api/campaigns'
import { CampaignCard } from '../components/campaigns/CampaignCard'
import { CampaignFilters } from '../components/campaigns/CampaignFilters'

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
  .mmf-campaigns-grid {
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .mmf-campaigns-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .mmf-campaigns-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`

let campaignsStyleInjected = false
function ensureCampaignsStyle() {
  if (campaignsStyleInjected || typeof document === 'undefined') return
  campaignsStyleInjected = true
  const el = document.createElement('style')
  el.textContent = cssOverrides
  document.head.appendChild(el)
}

function filtersFromParams(params: URLSearchParams): CampaignFilterParams {
  const search = params.get('search') || undefined
  const cats = params.get('categories')
  const categories = cats ? cats.split(',').filter(Boolean) : undefined
  return {
    search,
    categories: categories && categories.length > 0 ? categories : undefined,
  }
}

export function CampaignsPage() {
  ensureCampaignsStyle()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = filtersFromParams(searchParams)
  const { data: campaigns, isLoading, isError } = useCampaigns(filters)

  function handleFiltersChange(f: CampaignFilterParams) {
    const next = new URLSearchParams()
    if (f.search) next.set('search', f.search)
    if (f.categories && f.categories.length > 0) next.set('categories', f.categories.join(','))
    setSearchParams(next, { replace: true })
  }

  return (
    <section style={pageStyle}>
      <h1 style={headingStyle}>Explore Missions</h1>
      <p style={subheadingStyle}>Support the missions driving humanity toward Mars.</p>

      <CampaignFilters filters={filters} onFiltersChange={handleFiltersChange} />

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

      {campaigns && (
        <>
          <p style={resultCountStyle} aria-live="polite">
            {campaigns.length} mission{campaigns.length !== 1 ? 's' : ''} found
          </p>
          <div className="mmf-campaigns-grid" style={gridStyle} aria-label="Campaign listings">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
