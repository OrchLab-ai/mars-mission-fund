import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FundingProgressSection } from './FundingProgressSection'
import type { ProposalDetail } from '../../api/proposals'

const mockProposal: ProposalDetail = {
  id: '1',
  title: 'Test Proposal',
  summary: 'A test proposal',
  description: 'A test proposal description',
  heroImageUrl: null,
  status: 'Live',
  category: 'Propulsion',
  raisedAmount: 50000,
  goalAmount: 100000,
  contributorCount: 250,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  createdBy: null,
  slug: 'test-proposal',
  alignmentStatement: 'Aligned with mission.',
  tags: [],
  maxFundingCapUsd: 200000,
  launchedAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  milestones: [],
  stretchGoals: [],
  teamMembers: [],
  updates: [],
  creatorId: null,
  reviewerId: null,
  cancellationRequestedAt: null,
  riskDisclosures: [],
}

describe('FundingProgressSection', () => {
  it('renders raised amount', () => {
    render(<FundingProgressSection proposal={mockProposal} />)
    expect(screen.getByText('$50,000')).toBeInTheDocument()
  })

  it('renders target amount', () => {
    render(<FundingProgressSection proposal={mockProposal} />)
    expect(screen.getByText(/\$100,000/)).toBeInTheDocument()
  })

  it('renders contributor count', () => {
    render(<FundingProgressSection proposal={mockProposal} />)
    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('renders Contribute Now button linking to contribute page', () => {
    render(<FundingProgressSection proposal={mockProposal} />)
    const link = screen.getByRole('link', { name: 'Contribute Now' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/contribute/1')
  })

  it('renders time remaining', () => {
    render(<FundingProgressSection proposal={mockProposal} />)
    expect(screen.getByText(/remaining/i)).toBeInTheDocument()
  })
})
