import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ProposalsPage } from './ProposalsPage'

vi.mock('../hooks/useProposals', () => ({
  useProposals: () => ({ data: [], isLoading: false, isError: false }),
}))

vi.mock('../components/proposals/TrendingMissions', () => ({
  TrendingMissions: () => <section aria-label="trending stub">Trending Missions</section>,
}))

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ProposalsPage />
    </MemoryRouter>
  )
}

describe('ProposalsPage trending section', () => {
  it('shows Trending Missions above the main listing when no filters are active', () => {
    renderAt('/proposals')

    const trending = screen.getByLabelText('trending stub')
    const listing = screen.getByLabelText('Proposal listings')
    expect(
      trending.compareDocumentPosition(listing) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('hides Trending Missions when a search is active', () => {
    renderAt('/proposals?search=mars')
    expect(screen.queryByLabelText('trending stub')).not.toBeInTheDocument()
  })

  it('hides Trending Missions when a category filter is active', () => {
    renderAt('/proposals?categories=Propulsion')
    expect(screen.queryByLabelText('trending stub')).not.toBeInTheDocument()
  })
})
