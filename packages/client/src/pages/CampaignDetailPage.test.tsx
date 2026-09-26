import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { CampaignDetailPage } from './CampaignDetailPage'
import type { CampaignDetail } from '../api/campaigns'

const mockCampaign: CampaignDetail = {
  id: '1',
  title: 'Mars Habitat Alpha',
  summary: 'A test campaign about Mars.',
  description: 'A test campaign about Mars.',
  heroImageUrl: null,
  status: 'Live',
  category: 'Habitats & Construction',
  raisedAmount: 1_250_000,
  goalAmount: 2_000_000,
  contributorCount: 4_382,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  createdBy: null,
  slug: 'mars-habitat-alpha',
  alignmentStatement: 'Aligned with Mars mission.',
  tags: [],
  maxFundingCapUsd: 4_000_000,
  launchedAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  milestones: [
    {
      id: 'm1',
      title: 'Design Phase',
      description: 'Complete the design phase.',
      targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      fundingPercentage: 100,
      verificationCriteria: 'CAD files reviewed.',
      status: 'Pending',
      sortOrder: 1,
    },
  ],
  stretchGoals: [
    {
      id: 'sg1',
      description: 'Extra Module',
      deliverables: 'Adds extra module.',
      targetAmount: 2_500_000,
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
  creatorId: null,
  reviewerId: null,
  cancellationRequestedAt: null,
  riskDisclosures: [],
}

vi.mock('../hooks/useCampaign', () => ({
  useCampaign: () => ({
    data: mockCampaign,
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

describe('CampaignDetailPage', () => {
  it('renders campaign title', () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Mars Habitat Alpha')).toBeInTheDocument()
  })

  it('renders campaign category', () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Habitats & Construction')).toBeInTheDocument()
  })
})
