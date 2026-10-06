import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendingMissions, getTrendingProposals } from './TrendingMissions'
import type { ProposalSummary } from '../../api/proposals'

function makeProposal(overrides: Partial<ProposalSummary>): ProposalSummary {
  return {
    id: 'id',
    title: 'Mission',
    summary: 'A mission summary.',
    status: 'Live',
    category: 'Habitats & Construction',
    heroImageUrl: null,
    goalAmount: 1000,
    raisedAmount: 500,
    contributorCount: 0,
    deadline: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: null,
    ...overrides,
  }
}

describe('getTrendingProposals', () => {
  it('returns the top three live proposals by contributor count', () => {
    const proposals = [
      makeProposal({ id: 'a', contributorCount: 10 }),
      makeProposal({ id: 'b', contributorCount: 40 }),
      makeProposal({ id: 'c', contributorCount: 30 }),
      makeProposal({ id: 'd', contributorCount: 20 }),
    ]
    expect(getTrendingProposals(proposals).map((p) => p.id)).toEqual(['b', 'c', 'd'])
  })

  it('excludes proposals that are not live', () => {
    const proposals = [
      makeProposal({ id: 'a', status: 'Draft', contributorCount: 999 }),
      makeProposal({ id: 'b', status: 'Funded', contributorCount: 500 }),
      makeProposal({ id: 'c', status: 'Live', contributorCount: 1 }),
    ]
    expect(getTrendingProposals(proposals).map((p) => p.id)).toEqual(['c'])
  })

  it('does not mutate the input array', () => {
    const proposals = [
      makeProposal({ id: 'a', contributorCount: 1 }),
      makeProposal({ id: 'b', contributorCount: 2 }),
    ]
    getTrendingProposals(proposals)
    expect(proposals.map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('TrendingMissions', () => {
  it('renders the heading and trending cards in popularity order', () => {
    render(
      <TrendingMissions
        proposals={[
          makeProposal({ id: 'a', title: 'Low', contributorCount: 1 }),
          makeProposal({ id: 'b', title: 'High', contributorCount: 100 }),
        ]}
      />
    )
    expect(screen.getByRole('heading', { name: 'Trending Missions' })).toBeInTheDocument()
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['High', 'Low'])
  })

  it('renders nothing when there are no live proposals', () => {
    const { container } = render(
      <TrendingMissions proposals={[makeProposal({ status: 'Draft' })]} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
