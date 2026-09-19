import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ReviewDetailPage } from './ReviewDetailPage'
import type { ProposalDetail } from '../api/proposals'
import type { User } from '@mmf/shared'

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}))

const reviewerUser: User = {
  id: 'reviewer-1',
  email: 'reviewer@example.com',
  displayName: 'Demo Reviewer',
  bio: null,
  role: 'Reviewer',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const otherUser: User = {
  id: 'other-user',
  email: 'other@example.com',
  displayName: 'Other User',
  bio: null,
  role: 'Reviewer',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockProposal: ProposalDetail = {
  id: 'proposal-1',
  title: 'Mars Soil Analyser',
  summary: 'A portable mass spectrometer.',
  description: '<p>Understanding Martian soil chemistry.</p>',
  heroImageUrl: null,
  status: 'Under Review',
  category: 'In-Situ Resource Utilisation',
  raisedAmount: 0,
  goalAmount: 50000000,
  contributorCount: 0,
  deadline: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  createdBy: null,
  slug: 'mars-soil-analyser',
  alignmentStatement: 'Enables informed ISRU site selection.',
  tags: ['isru', 'soil'],
  maxFundingCapUsd: 150000000,
  launchedAt: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  milestones: [
    {
      id: 'm1',
      title: 'Prototype',
      description: 'Build the prototype.',
      targetDate: null,
      fundingPercentage: 50,
      verificationCriteria: 'Working prototype.',
      status: 'Pending',
      sortOrder: 1,
    },
  ],
  stretchGoals: [
    {
      id: 'sg1',
      description: 'Enhanced sensors',
      deliverables: 'Higher resolution results.',
      targetAmount: 100000000,
      unlocked: false,
      sortOrder: 1,
    },
  ],
  teamMembers: [
    {
      id: 'tm1',
      name: 'Dr. Elena Vasquez',
      role: 'Chief Engineer',
      bio: 'Experienced engineer.',
      sortOrder: 1,
    },
  ],
  updates: [],
  creatorId: 'creator-1',
  reviewerId: 'reviewer-1',
  cancellationRequestedAt: null,
  riskDisclosures: [],
}

vi.mock('../hooks/useProposal', () => ({
  useProposal: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

import { useProposal } from '../hooks/useProposal'
import { useAuthContext } from '../context/AuthContext'

function renderWithRouter(ui: React.ReactElement, { path = '/review/proposal-1' } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/review/:id" element={ui} />
        <Route path="/review" element={<div>Review Queue</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ReviewDetailPage', () => {
  it('shows loading state', () => {
    vi.mocked(useProposal).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useProposal>)
    vi.mocked(useAuthContext).mockReturnValue({
      user: reviewerUser,
      token: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ReviewDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', () => {
    vi.mocked(useProposal).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useProposal>)
    vi.mocked(useAuthContext).mockReturnValue({
      user: reviewerUser,
      token: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ReviewDetailPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('redirects to /review when user is not the assigned reviewer', () => {
    vi.mocked(useProposal).mockReturnValue({
      data: mockProposal,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useProposal>)
    vi.mocked(useAuthContext).mockReturnValue({
      user: otherUser,
      token: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ReviewDetailPage />)
    expect(screen.getByText('Review Queue')).toBeInTheDocument()
  })

  it('redirects to /review when user is null', () => {
    vi.mocked(useProposal).mockReturnValue({
      data: mockProposal,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useProposal>)
    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ReviewDetailPage />)
    expect(screen.getByText('Review Queue')).toBeInTheDocument()
  })

  it('renders proposal title and sections for assigned reviewer', () => {
    vi.mocked(useProposal).mockReturnValue({
      data: mockProposal,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useProposal>)
    vi.mocked(useAuthContext).mockReturnValue({
      user: reviewerUser,
      token: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ReviewDetailPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mars Soil Analyser')
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })

  it('renders proposal sections for assigned reviewer', () => {
    vi.mocked(useProposal).mockReturnValue({
      data: mockProposal,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useProposal>)
    vi.mocked(useAuthContext).mockReturnValue({
      user: reviewerUser,
      token: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ReviewDetailPage />)
    // Team section
    expect(screen.getByText('Dr. Elena Vasquez')).toBeInTheDocument()
    // Milestone section
    expect(screen.getByText('Prototype')).toBeInTheDocument()
    // Stretch goal section
    expect(screen.getByText('Enhanced sensors')).toBeInTheDocument()
  })

  it('shows ReviewActionsPanel for assigned reviewer with Under Review proposal', () => {
    vi.mocked(useProposal).mockReturnValue({
      data: mockProposal,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useProposal>)
    vi.mocked(useAuthContext).mockReturnValue({
      user: reviewerUser,
      token: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ReviewDetailPage />)
    expect(screen.getByLabelText('Review actions')).toBeInTheDocument()
  })
})
