import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProposalFormPage } from './ProposalFormPage'
import type { ProposalDetail } from '../api/proposals'

vi.mock('../api/proposals', () => ({
  fetchProposal: vi.fn(),
  createProposal: vi.fn(),
  updateProposal: vi.fn(),
  submitProposalForReview: vi.fn(),
}))

import { fetchProposal, createProposal } from '../api/proposals'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderPage(props: { proposalId?: string } = {}) {
  const qc = makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProposalFormPage {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockProposal: ProposalDetail = {
  id: 'c1',
  title: 'Mars Habitat Alpha',
  summary: 'A habitat on Mars.',
  description: 'Full description here.',
  heroImageUrl: null,
  status: 'Draft',
  category: 'Habitats & Construction',
  raisedAmount: 0,
  goalAmount: 5_000_000,
  contributorCount: 0,
  deadline: null,
  createdAt: new Date('2024-01-01'),
  createdBy: null,
  slug: 'mars-habitat-alpha',
  alignmentStatement: 'Aligned with the mission.',
  tags: [],
  maxFundingCapUsd: 0,
  launchedAt: null,
  updatedAt: new Date('2024-01-01'),
  creatorId: 'u1',
  reviewerId: null,
  cancellationRequestedAt: null,
  milestones: [
    {
      id: 'm1',
      title: 'Phase 1',
      description: 'First phase.',
      targetDate: null,
      fundingPercentage: 50,
      verificationCriteria: null,
      status: 'Pending',
      sortOrder: 0,
    },
    {
      id: 'm2',
      title: 'Phase 2',
      description: 'Second phase.',
      targetDate: null,
      fundingPercentage: 50,
      verificationCriteria: null,
      status: 'Pending',
      sortOrder: 1,
    },
  ],
  stretchGoals: [],
  teamMembers: [
    {
      id: 'tm1',
      name: 'Dr. Elena Vasquez',
      role: 'Chief Engineer',
      bio: null,
      sortOrder: 0,
    },
  ],
  updates: [],
  riskDisclosures: ['Habitat pressure failure', 'Dust storm damage'],
}

describe('ProposalFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLDialogElement.prototype.showModal = vi.fn().mockImplementation(function (
      this: HTMLDialogElement
    ) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn().mockImplementation(function (
      this: HTMLDialogElement
    ) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    })
  })

  it('renders step 1 with title and category fields', () => {
    renderPage()

    expect(screen.getByText('Step 1: Mission Objectives')).toBeInTheDocument()
    expect(screen.getByLabelText('Title *')).toBeInTheDocument()
    expect(screen.getByLabelText('Category *')).toBeInTheDocument()
  })

  it('shows 7-step navigation indicator', () => {
    renderPage()

    expect(screen.getByRole('navigation', { name: 'Form steps' })).toBeInTheDocument()
    expect(screen.getByText('Mission')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('blocks Next on step 1 when title is empty', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Title is required.')
    })
  })

  it('blocks Next on step 1 when category is not selected', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Title *'), {
      target: { value: 'My Proposal' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Category is required.')
    })
  })

  it('calls createProposal when Save Draft is clicked in create mode', async () => {
    vi.mocked(createProposal).mockResolvedValue({ ...mockProposal, id: 'new-id' })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => {
      expect(createProposal).toHaveBeenCalledOnce()
    })
  })

  it('blocks Next on step 4 when milestone percentages do not sum to 100', async () => {
    renderPage()

    // Step 1: fill required fields
    fireEvent.change(screen.getByLabelText('Title *'), {
      target: { value: 'Test Proposal' },
    })
    fireEvent.change(screen.getByLabelText('Category *'), {
      target: { value: 'Propulsion' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2: fill team member (name + role)
    await waitFor(() => {
      expect(screen.getByText('Step 2: Team Members')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Alice' },
    })
    fireEvent.change(screen.getByLabelText('Role *'), {
      target: { value: 'CEO' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 3: fill minimum funding target
    await waitFor(() => {
      expect(screen.getByText('Step 3: Funding Goals')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText('Minimum Funding Target (USD) *'), {
      target: { value: '5000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 4: milestones with percentages that don't sum to 100
    await waitFor(() => {
      expect(screen.getByText('Step 4: Milestones')).toBeInTheDocument()
    })

    const titleInputs = screen.getAllByLabelText('Title *')
    const pctInputs = screen.getAllByLabelText('Funding % *')

    fireEvent.change(titleInputs[0], { target: { value: 'Milestone One' } })
    fireEvent.change(pctInputs[0], { target: { value: '30' } })
    fireEvent.change(titleInputs[1], { target: { value: 'Milestone Two' } })
    fireEvent.change(pctInputs[1], { target: { value: '30' } })

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Milestone funding percentages must sum to 100%'
      )
    })
  })

  it('pre-populates Step 5 risk disclosures from existing proposal data', async () => {
    vi.mocked(fetchProposal).mockResolvedValue(mockProposal)

    renderPage({ proposalId: 'c1' })

    // Wait for data to load and form to initialise
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mars Habitat Alpha')).toBeInTheDocument()
    })

    // Step 1: fill required fields and advance
    fireEvent.change(screen.getByLabelText('Title *'), {
      target: { value: 'Mars Habitat Alpha' },
    })
    fireEvent.change(screen.getByLabelText('Category *'), {
      target: { value: 'Habitats & Construction' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2: team member already filled from mock; advance
    await waitFor(() => {
      expect(screen.getByText('Step 2: Team Members')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 3: fill minimum funding target and advance
    await waitFor(() => {
      expect(screen.getByText('Step 3: Funding Goals')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText('Minimum Funding Target (USD) *'), {
      target: { value: '5000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 4: milestones from mock sum to 100; advance
    await waitFor(() => {
      expect(screen.getByText('Step 4: Milestones')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 5: risk disclosures should be pre-populated
    await waitFor(() => {
      expect(screen.getByText('Step 5: Risk Disclosures')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Habitat pressure failure')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dust storm damage')).toBeInTheDocument()
  })

  it('initialises form from existing proposal data in edit mode', async () => {
    vi.mocked(fetchProposal).mockResolvedValue(mockProposal)

    renderPage({ proposalId: 'c1' })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Mars Habitat Alpha')).toBeInTheDocument()
    })

    expect(fetchProposal).toHaveBeenCalledWith('c1')
  })

  it('dialog has an accessible name via aria-labelledby pointing to the heading', () => {
    renderPage()

    // Query the dialog element directly (implicit role='dialog' is only exposed
    // when the dialog is open; attribute checks don't require it to be open)
    const dialog = document.querySelector('dialog')
    expect(dialog).not.toBeNull()
    expect(dialog).toHaveAttribute('aria-labelledby', 'submit-dialog-title')
    const heading = document.getElementById('submit-dialog-title')
    expect(heading).not.toBeNull()
    expect(heading).toHaveTextContent('Submit for Review')
  })

  it('returns focus to the trigger button after the dialog closes', async () => {
    vi.mocked(fetchProposal).mockResolvedValue(mockProposal)
    renderPage({ proposalId: 'c1' })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Mars Habitat Alpha')).toBeInTheDocument()
    })

    // Step 1: advance with pre-populated data
    fireEvent.change(screen.getByLabelText('Title *'), {
      target: { value: 'Mars Habitat Alpha' },
    })
    fireEvent.change(screen.getByLabelText('Category *'), {
      target: { value: 'Habitats & Construction' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2: advance (team member from mock)
    await waitFor(() => screen.getByText('Step 2: Team Members'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 3: fill funding target and advance
    await waitFor(() => screen.getByText('Step 3: Funding Goals'))
    fireEvent.change(screen.getByLabelText('Minimum Funding Target (USD) *'), {
      target: { value: '5000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 4: milestones from mock sum to 100; advance
    await waitFor(() => screen.getByText('Step 4: Milestones'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 5: advance (risk disclosures from mock)
    await waitFor(() => screen.getByText('Step 5: Risk Disclosures'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 6: advance (no required fields)
    await waitFor(() => screen.getByText('Step 6: Media'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 7: Review & Submit
    await waitFor(() => screen.getByText('Step 7: Review & Submit'))

    const triggerButton = screen.getByRole('button', { name: 'Submit proposal for review' })

    // Open the dialog
    fireEvent.click(triggerButton)
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce()

    // Close the dialog via Cancel button
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    // Focus should return to the trigger button
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton)
    })
  })

  it('shows formatted deadline on Step 7 review screen', async () => {
    const proposalWithDeadline: ProposalDetail = {
      ...mockProposal,
      deadline: new Date('2026-12-27'),
    }
    vi.mocked(fetchProposal).mockResolvedValue(proposalWithDeadline)
    renderPage({ proposalId: 'c1' })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Mars Habitat Alpha')).toBeInTheDocument()
    })

    // Step 1: advance
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Mars Habitat Alpha' } })
    fireEvent.change(screen.getByLabelText('Category *'), {
      target: { value: 'Habitats & Construction' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2: advance
    await waitFor(() => screen.getByText('Step 2: Team Members'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 3: fill funding target and advance
    await waitFor(() => screen.getByText('Step 3: Funding Goals'))
    fireEvent.change(screen.getByLabelText('Minimum Funding Target (USD) *'), {
      target: { value: '5000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 4: advance
    await waitFor(() => screen.getByText('Step 4: Milestones'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 5: advance
    await waitFor(() => screen.getByText('Step 5: Risk Disclosures'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 6: advance
    await waitFor(() => screen.getByText('Step 6: Media'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 7: verify formatted deadline
    await waitFor(() => screen.getByText('Step 7: Review & Submit'))
    expect(screen.getByText('Dec 27, 2026')).toBeInTheDocument()
    expect(screen.queryByText('2026-12-27')).not.toBeInTheDocument()
  })
})
