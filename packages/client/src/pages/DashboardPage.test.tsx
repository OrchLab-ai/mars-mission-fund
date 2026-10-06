import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from './DashboardPage'
import type { CampaignSummary } from '../api/campaigns'

vi.mock('../hooks/useCreatorCampaigns', () => ({
  useCreatorCampaigns: vi.fn(),
}))

vi.mock('../api/campaigns', () => ({
  deleteCampaign: vi.fn().mockResolvedValue(undefined),
  submitCampaignForReview: vi.fn().mockResolvedValue(undefined),
  launchCampaign: vi.fn().mockResolvedValue(undefined),
  resubmitCampaign: vi.fn().mockResolvedValue(undefined),
}))

import { useCreatorCampaigns } from '../hooks/useCreatorCampaigns'

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

const baseCampaign: CampaignSummary = {
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
    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading your campaigns…')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', () => {
    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Failed to load your campaigns. Please try again.')).toBeInTheDocument()
  })

  it('shows empty state when there are no campaigns', () => {
    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    expect(screen.getByText('You have no campaigns yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create your first campaign' })).toBeInTheDocument()
  })

  it('always shows the "+ New Campaign" link', () => {
    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    const link = screen.getByRole('link', { name: '+ New Campaign' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/campaigns/new')
  })

  it('renders campaigns grouped by status sections', () => {
    const liveCampaign: CampaignSummary = {
      ...baseCampaign,
      id: 'c2',
      title: 'Mars Power Grid',
      status: 'Live',
      raisedAmount: 1_000_000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }

    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: [baseCampaign, liveCampaign],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    expect(screen.getByText('Mars Habitat Alpha')).toBeInTheDocument()
    expect(screen.getByText('Mars Power Grid')).toBeInTheDocument()

    // Status group section headings
    expect(screen.getByRole('heading', { name: 'Draft' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Active' })).toBeInTheDocument()
  })

  it('shows Edit, Submit, and Delete actions for Draft campaigns', () => {
    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: [baseCampaign],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    expect(
      screen.getByRole('button', { name: 'Submit Mars Habitat Alpha for review' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Mars Habitat Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument()
  })

  it('shows Launch action for Approved campaigns', () => {
    const approvedCampaign: CampaignSummary = {
      ...baseCampaign,
      id: 'c3',
      title: 'Mars Water System',
      status: 'Approved',
    }

    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: [approvedCampaign],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    expect(screen.getByRole('button', { name: 'Launch Mars Water System' })).toBeInTheDocument()
  })

  it('shows View link for Live campaigns', () => {
    const liveCampaign: CampaignSummary = {
      ...baseCampaign,
      id: 'c4',
      title: 'Mars Solar Array',
      status: 'Live',
    }

    vi.mocked(useCreatorCampaigns).mockReturnValue({
      data: [liveCampaign],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreatorCampaigns>)

    renderPage()

    expect(screen.getByRole('link', { name: 'View' })).toBeInTheDocument()
  })
})
