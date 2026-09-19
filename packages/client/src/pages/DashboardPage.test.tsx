import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from './DashboardPage'
import type { ProposalSummary } from '../api/proposals'

vi.mock('../hooks/useCreatorProposals', () => ({
  useCreatorProposals: vi.fn(),
}))

vi.mock('../api/proposals', () => ({
  deleteProposal: vi.fn().mockResolvedValue(undefined),
  submitProposalForReview: vi.fn().mockResolvedValue(undefined),
  launchProposal: vi.fn().mockResolvedValue(undefined),
  resubmitProposal: vi.fn().mockResolvedValue(undefined),
}))

import { useCreatorProposals } from '../hooks/useCreatorProposals'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderPage() {
  const qc = makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const baseProposal: ProposalSummary = {
  id: 'c1',
  title: 'Mars Habitat Alpha',
  summary: 'A Mars habitat.',
  status: 'Draft',
  category: 'Habitats & Construction',
  heroImageUrl: null,
  goalAmount: 5_000_000,
  raisedAmount: 0,
  contributorCount: 0,
  deadline: null,
  createdAt: new Date('2024-01-01'),
  createdBy: null,
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while fetching', () => {
    vi.mocked(useCreatorProposals).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading your proposals…')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', () => {
    vi.mocked(useCreatorProposals).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Failed to load your proposals. Please try again.')).toBeInTheDocument()
  })

  it('shows empty state when there are no proposals', () => {
    vi.mocked(useCreatorProposals).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    expect(screen.getByText('You have no proposals yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create your first proposal' })).toBeInTheDocument()
  })

  it('always shows the "+ New Proposal" link', () => {
    vi.mocked(useCreatorProposals).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    const link = screen.getByRole('link', { name: '+ New Proposal' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/proposals/new')
  })

  it('renders proposals grouped by status sections', () => {
    const liveProposal: ProposalSummary = {
      ...baseProposal,
      id: 'c2',
      title: 'Mars Power Grid',
      status: 'Live',
      raisedAmount: 1_000_000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }

    vi.mocked(useCreatorProposals).mockReturnValue({
      data: [baseProposal, liveProposal],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    expect(screen.getByText('Mars Habitat Alpha')).toBeInTheDocument()
    expect(screen.getByText('Mars Power Grid')).toBeInTheDocument()

    // Status group section headings
    expect(screen.getByRole('heading', { name: 'Draft' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Active' })).toBeInTheDocument()
  })

  it('shows Edit, Submit, and Delete actions for Draft proposals', () => {
    vi.mocked(useCreatorProposals).mockReturnValue({
      data: [baseProposal],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    expect(
      screen.getByRole('button', { name: 'Submit Mars Habitat Alpha for review' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Mars Habitat Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument()
  })

  it('shows Launch action for Approved proposals', () => {
    const approvedProposal: ProposalSummary = {
      ...baseProposal,
      id: 'c3',
      title: 'Mars Water System',
      status: 'Approved',
    }

    vi.mocked(useCreatorProposals).mockReturnValue({
      data: [approvedProposal],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    expect(screen.getByRole('button', { name: 'Launch Mars Water System' })).toBeInTheDocument()
  })

  it('shows View link for Live proposals', () => {
    const liveProposal: ProposalSummary = {
      ...baseProposal,
      id: 'c4',
      title: 'Mars Solar Array',
      status: 'Live',
    }

    vi.mocked(useCreatorProposals).mockReturnValue({
      data: [liveProposal],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorProposals>)

    renderPage()

    expect(screen.getByRole('link', { name: 'View' })).toBeInTheDocument()
  })
})
