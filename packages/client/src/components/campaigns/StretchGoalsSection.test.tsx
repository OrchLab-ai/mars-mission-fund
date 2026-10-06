import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StretchGoalsSection } from './StretchGoalsSection'
import type { StretchGoal } from '../../api/campaigns'

const mockGoals: StretchGoal[] = [
  {
    id: 'sg1',
    description: 'Extra Life Support Module',
    deliverables: 'Adds redundant life-support.',
    targetAmount: 2_500_000,
    unlocked: false,
    sortOrder: 1,
  },
  {
    id: 'sg2',
    description: 'Advanced Navigation System',
    deliverables: 'Enhanced navigation for long trips.',
    targetAmount: 3_000_000,
    unlocked: true,
    sortOrder: 2,
  },
]

describe('StretchGoalsSection', () => {
  it('renders stretch goal description as heading when goals are present', () => {
    render(<StretchGoalsSection stretchGoals={mockGoals} />)
    expect(screen.getByText('Extra Life Support Module')).toBeInTheDocument()
    expect(screen.getByText('Advanced Navigation System')).toBeInTheDocument()
  })

  it('renders nothing when stretch goals array is empty', () => {
    const { container } = render(<StretchGoalsSection stretchGoals={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders section heading when goals are present', () => {
    render(<StretchGoalsSection stretchGoals={mockGoals} />)
    expect(screen.getByText('Stretch Goals')).toBeInTheDocument()
  })

  it('shows unlocked/locked state for each goal', () => {
    render(<StretchGoalsSection stretchGoals={mockGoals} />)
    expect(screen.getByText('Locked')).toBeInTheDocument()
    expect(screen.getByText('Unlocked')).toBeInTheDocument()
  })
})
