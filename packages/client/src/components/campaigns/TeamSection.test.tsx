import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamSection } from './TeamSection'
import type { TeamMember } from '../../api/campaigns'

const mockMembers: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Dr. Elena Vasquez',
    role: 'Chief Systems Engineer',
    bio: 'Former NASA engineer with 15 years experience.',
    sortOrder: 1,
  },
  {
    id: 'tm2',
    name: 'Marcus Okafor',
    role: 'Materials Scientist',
    bio: 'Specialises in radiation-shielding composites.',
    sortOrder: 2,
  },
]

describe('TeamSection', () => {
  it('renders team member names', () => {
    render(<TeamSection teamMembers={mockMembers} />)
    expect(screen.getByText('Dr. Elena Vasquez')).toBeInTheDocument()
    expect(screen.getByText('Marcus Okafor')).toBeInTheDocument()
  })

  it('renders team member roles', () => {
    render(<TeamSection teamMembers={mockMembers} />)
    expect(screen.getByText('Chief Systems Engineer')).toBeInTheDocument()
    expect(screen.getByText('Materials Scientist')).toBeInTheDocument()
  })

  it('renders team member bios', () => {
    render(<TeamSection teamMembers={mockMembers} />)
    expect(screen.getByText('Former NASA engineer with 15 years experience.')).toBeInTheDocument()
  })

  it('renders section heading', () => {
    render(<TeamSection teamMembers={mockMembers} />)
    expect(screen.getByText('Team')).toBeInTheDocument()
  })
})
