import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ProposalsPage } from './ProposalsPage'
import type { ProposalSummary } from '../api/proposals'

function makeProposal(id: string, contributorCount: number): ProposalSummary {
  return {
    id,
    title: `Mission ${id}`,
    summary: 'A mission summary.',
    status: 'Live',
    category: 'Habitats & Construction',
    heroImageUrl: null,
    goalAmount: 1000,
    raisedAmount: 500,
    contributorCount,
    deadline: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: null,
  }
}

const proposals = [
  makeProposal('a', 1),
  makeProposal('b', 4),
  makeProposal('c', 3),
  makeProposal('d', 2),
]

vi.mock('../hooks/useProposals', () => ({
  useProposals: () => ({ data: proposals, isLoading: false, isError: false }),
}))

describe('ProposalsPage', () => {
  it('shows Trending Missions above the main grid', () => {
    render(
      <MemoryRouter>
        <ProposalsPage />
      </MemoryRouter>
    )
    const trending = screen.getByRole('heading', { name: 'Trending Missions' })
    const trendingGrid = screen.getByLabelText('Trending missions')
    const mainGrid = screen.getByLabelText('Proposal listings')

    expect(trendingGrid.querySelectorAll('h3')).toHaveLength(3)
    expect(mainGrid.querySelectorAll('h3')).toHaveLength(4)
    expect(
      trending.compareDocumentPosition(mainGrid) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
