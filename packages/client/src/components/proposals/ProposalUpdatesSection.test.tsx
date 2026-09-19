import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProposalUpdatesSection } from './ProposalUpdatesSection'
import type { ProposalUpdate } from '../../api/proposals'

const mockUpdates: ProposalUpdate[] = [
  {
    id: 'u1',
    postedAt: new Date('2024-01-15T00:00:00.000Z'),
    body: 'We completed the first milestone successfully.',
  },
  {
    id: 'u2',
    postedAt: new Date('2024-02-01T00:00:00.000Z'),
    body: 'Things are going well.',
  },
]

describe('ProposalUpdatesSection', () => {
  it('renders update body text when updates are present', () => {
    render(<ProposalUpdatesSection updates={mockUpdates} />)
    expect(screen.getByText('We completed the first milestone successfully.')).toBeInTheDocument()
    expect(screen.getByText('Things are going well.')).toBeInTheDocument()
  })

  it('renders "No updates yet." when updates array is empty', () => {
    render(<ProposalUpdatesSection updates={[]} />)
    expect(screen.getByText('No updates yet.')).toBeInTheDocument()
  })

  it('renders section heading', () => {
    render(<ProposalUpdatesSection updates={mockUpdates} />)
    expect(screen.getByText('Updates')).toBeInTheDocument()
  })

  it('renders update body text', () => {
    render(<ProposalUpdatesSection updates={mockUpdates} />)
    expect(screen.getByText('We completed the first milestone successfully.')).toBeInTheDocument()
  })
})
