import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TrendingMissions } from './TrendingMissions'
import type { ProposalSummary } from '../../api/proposals'

function makeProposal(overrides: Partial<ProposalSummary>): ProposalSummary {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Mission',
    summary: 'A mission summary.',
    status: 'Live',
    category: 'Propulsion',
    heroImageUrl: null,
    goalAmount: 1_000_000,
    raisedAmount: 250_000,
    contributorCount: 10,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: null,
    ...overrides,
  }
}

const mockUseTrendingProposals = vi.fn()
vi.mock('../../hooks/useTrendingProposals', () => ({
  useTrendingProposals: () => mockUseTrendingProposals(),
}))

function renderSection() {
  return render(
    <MemoryRouter>
      <TrendingMissions />
    </MemoryRouter>
  )
}

describe('TrendingMissions', () => {
  beforeEach(() => {
    mockUseTrendingProposals.mockReset()
  })

  it('renders a Trending Missions heading and one card per proposal, in the order given', () => {
    mockUseTrendingProposals.mockReturnValue({
      data: [
        makeProposal({ id: '11111111-1111-4111-8111-111111111111', title: 'Alpha' }),
        makeProposal({ id: '22222222-2222-4222-8222-222222222222', title: 'Bravo' }),
        makeProposal({ id: '33333333-3333-4333-8333-333333333333', title: 'Charlie' }),
      ],
    })
    renderSection()

    expect(screen.getByRole('heading', { level: 2, name: 'Trending Missions' })).toBeInTheDocument()
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('shows the contributor count on each card', () => {
    mockUseTrendingProposals.mockReturnValue({
      data: [
        makeProposal({ title: 'Alpha', contributorCount: 4382 }),
        makeProposal({
          id: '22222222-2222-4222-8222-222222222222',
          title: 'Bravo',
          contributorCount: 1,
        }),
      ],
    })
    renderSection()

    const group = screen.getByLabelText('Trending missions')
    expect(within(group).getByText('4,382 contributors')).toBeInTheDocument()
    expect(within(group).getByText('1 contributor')).toBeInTheDocument()
  })

  it('links each card to its mission page', () => {
    mockUseTrendingProposals.mockReturnValue({
      data: [makeProposal({ id: '11111111-1111-4111-8111-111111111111', title: 'Alpha' })],
    })
    renderSection()

    expect(screen.getByRole('link', { name: 'View Mission' })).toHaveAttribute(
      'href',
      '/proposals/11111111-1111-4111-8111-111111111111'
    )
  })

  it('renders nothing when there are no trending proposals', () => {
    mockUseTrendingProposals.mockReturnValue({ data: [] })
    const { container } = renderSection()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while loading or on error', () => {
    mockUseTrendingProposals.mockReturnValue({ data: undefined, isLoading: true })
    const { container, rerender } = renderSection()
    expect(container).toBeEmptyDOMElement()

    mockUseTrendingProposals.mockReturnValue({ data: undefined, isError: true })
    rerender(
      <MemoryRouter>
        <TrendingMissions />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })
})
