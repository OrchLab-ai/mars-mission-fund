import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UpdatesSection } from './UpdatesSection'
import type { ProposalUpdate } from '../../api/proposals'
import type { User } from '@mmf/shared'

vi.mock('../../api/proposals', () => ({
  fetchProposalUpdates: vi.fn(),
  postProposalUpdate: vi.fn(),
}))

import { fetchProposalUpdates, postProposalUpdate } from '../../api/proposals'

const mockFetch = vi.mocked(fetchProposalUpdates)
const mockPost = vi.mocked(postProposalUpdate)

const PROPOSAL_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890'
const CREATOR_ID = '22222222-2222-4222-8222-222222222222'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: CREATOR_ID,
    email: 'creator@example.com',
    displayName: 'Demo Creator',
    bio: null,
    role: 'Creator',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

const older: ProposalUpdate = {
  id: 'd4e5f6a7-b8c9-4123-8ef0-234567890123',
  title: 'Engine hot-fire complete',
  body: 'The full-duration test ran clean.',
  authorName: 'Demo Creator',
  createdAt: new Date('2026-02-01T12:00:00.000Z'),
}

const newer: ProposalUpdate = {
  id: 'c3d4e5f6-a7b8-4012-8def-123456789012',
  title: 'Heat shield delayed',
  body: 'Line one.\nLine two.',
  authorName: 'Dr. Elena Vasquez',
  createdAt: new Date('2026-03-01T12:00:00.000Z'),
}

function renderSection(user: User | null, creatorId: string | null = CREATOR_ID) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <UpdatesSection proposalId={PROPOSAL_ID} creatorId={creatorId} user={user} />
    </QueryClientProvider>
  )
}

describe('UpdatesSection', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockPost.mockReset()
  })

  describe('list', () => {
    it('renders the Updates heading with each update title, author, date and body', async () => {
      mockFetch.mockResolvedValue([newer, older])
      renderSection(null)

      expect(await screen.findByText('Heat shield delayed')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Updates' })).toBeInTheDocument()
      expect(screen.getByText(/Dr\. Elena Vasquez/)).toBeInTheDocument()
      expect(screen.getByText('March 1, 2026')).toBeInTheDocument()
      expect(screen.getByText(/Line one\./)).toBeInTheDocument()
      expect(screen.getByText('Engine hot-fire complete')).toBeInTheDocument()
      expect(screen.getByText('February 1, 2026')).toBeInTheDocument()
    })

    it('lists the newest update first, even if the API sends them in another order', async () => {
      mockFetch.mockResolvedValue([older, newer])
      renderSection(null)

      await screen.findByText('Heat shield delayed')
      const titles = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
      expect(titles).toEqual(['Heat shield delayed', 'Engine hot-fire complete'])
    })

    it('keeps the line breaks in the body', async () => {
      mockFetch.mockResolvedValue([newer])
      renderSection(null)

      const body = await screen.findByText(/Line one\./)
      expect(body.textContent).toBe('Line one.\nLine two.')
      expect(body).toHaveStyle({ whiteSpace: 'pre-wrap' })
    })

    it('shows the body as plain text, not as HTML', async () => {
      mockFetch.mockResolvedValue([{ ...newer, body: '<b>bold</b> <img src=x onerror=alert(1)>' }])
      const { container } = renderSection(null)

      expect(await screen.findByText(/<b>bold<\/b>/)).toBeInTheDocument()
      expect(container.querySelector('b')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
    })

    it('names the author as the mission team when the account has no display name', async () => {
      mockFetch.mockResolvedValue([{ ...newer, authorName: null }])
      renderSection(null)

      expect(await screen.findByText(/Mission team/)).toBeInTheDocument()
    })

    it('says there are no updates yet instead of rendering an empty list', async () => {
      mockFetch.mockResolvedValue([])
      renderSection(null)

      expect(
        await screen.findByText('No updates yet. The mission team will post progress here.')
      ).toBeInTheDocument()
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('shows a loading message while the updates load', () => {
      mockFetch.mockReturnValue(new Promise(() => {}))
      renderSection(null)

      expect(screen.getByText('Loading updates…')).toBeInTheDocument()
    })

    it('shows an error message when the updates cannot be loaded', async () => {
      mockFetch.mockRejectedValue(new Error('HTTP 500'))
      renderSection(null)

      expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t load updates/i)
    })
  })

  describe('who sees the form', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue([])
    })

    it('shows the form to the signed-in creator of this proposal', async () => {
      renderSection(makeUser())

      expect(await screen.findByRole('form', { name: 'Post an update' })).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Update')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Post update' })).toBeInTheDocument()
    })

    it('hides the form from a visitor who is not signed in', async () => {
      renderSection(null)

      await screen.findByText(/No updates yet/)
      expect(screen.queryByRole('form', { name: 'Post an update' })).not.toBeInTheDocument()
    })

    it('hides the form from a signed-in backer', async () => {
      renderSection(makeUser({ id: '11111111-1111-4111-8111-111111111111', role: 'Backer' }))

      await screen.findByText(/No updates yet/)
      expect(screen.queryByRole('form', { name: 'Post an update' })).not.toBeInTheDocument()
    })

    it('hides the form from a creator who does not own this proposal', async () => {
      renderSection(makeUser({ id: '55555555-5555-4555-8555-555555555555' }))

      await screen.findByText(/No updates yet/)
      expect(screen.queryByRole('form', { name: 'Post an update' })).not.toBeInTheDocument()
    })

    it('hides the form when the proposal has no creator on record', async () => {
      renderSection(makeUser(), null)

      await screen.findByText(/No updates yet/)
      expect(screen.queryByRole('form', { name: 'Post an update' })).not.toBeInTheDocument()
    })
  })

  describe('posting', () => {
    it('keeps the button disabled until both fields have text', async () => {
      mockFetch.mockResolvedValue([])
      renderSection(makeUser())

      const button = await screen.findByRole('button', { name: 'Post update' })
      expect(button).toBeDisabled()

      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hello' } })
      expect(button).toBeDisabled()

      fireEvent.change(screen.getByLabelText('Update'), { target: { value: '   ' } })
      expect(button).toBeDisabled()

      fireEvent.change(screen.getByLabelText('Update'), { target: { value: 'Body' } })
      expect(button).toBeEnabled()
    })

    it('limits the title to 120 characters and the body to 5000', async () => {
      mockFetch.mockResolvedValue([])
      renderSection(makeUser())

      expect(await screen.findByLabelText('Title')).toHaveAttribute('maxlength', '120')
      expect(screen.getByLabelText('Update')).toHaveAttribute('maxlength', '5000')
    })

    it('posts the trimmed text, clears the form and shows the new update at the top without a reload', async () => {
      const posted: ProposalUpdate = {
        id: 'e5f6a7b8-c9d0-4234-8f01-345678901234',
        title: 'Parachute test passed',
        body: 'It opened at full speed.',
        authorName: 'Demo Creator',
        createdAt: new Date('2026-04-01T12:00:00.000Z'),
      }
      mockFetch.mockResolvedValueOnce([older])
      mockFetch.mockResolvedValue([posted, older])
      mockPost.mockResolvedValue(posted)
      renderSection(makeUser())

      await screen.findByText('Engine hot-fire complete')

      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: '  Parachute test passed  ' },
      })
      fireEvent.change(screen.getByLabelText('Update'), {
        target: { value: ' It opened at full speed. ' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Post update' }))

      await waitFor(() => {
        const titles = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
        expect(titles).toEqual(['Parachute test passed', 'Engine hot-fire complete'])
      })
      expect(mockPost).toHaveBeenCalledWith(PROPOSAL_ID, {
        title: 'Parachute test passed',
        body: 'It opened at full speed.',
      })
      expect(screen.getByLabelText('Title')).toHaveValue('')
      expect(screen.getByLabelText('Update')).toHaveValue('')
      expect(screen.getByRole('status')).toHaveTextContent('Update posted.')
    })

    it('replaces the empty message once the first update is posted', async () => {
      const posted: ProposalUpdate = { ...newer, authorName: 'Demo Creator' }
      mockFetch.mockResolvedValueOnce([])
      mockFetch.mockResolvedValue([posted])
      mockPost.mockResolvedValue(posted)
      renderSection(makeUser())

      await screen.findByText(/No updates yet/)
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Heat shield delayed' } })
      fireEvent.change(screen.getByLabelText('Update'), { target: { value: 'Body' } })
      fireEvent.click(screen.getByRole('button', { name: 'Post update' }))

      expect(await screen.findByRole('heading', { level: 4 })).toHaveTextContent(
        'Heat shield delayed'
      )
      expect(screen.queryByText(/No updates yet/)).not.toBeInTheDocument()
    })

    it('shows an error and keeps what was typed when posting fails', async () => {
      mockFetch.mockResolvedValue([])
      mockPost.mockRejectedValue(new Error('HTTP 500'))
      renderSection(makeUser())

      await screen.findByText(/No updates yet/)
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep me' } })
      fireEvent.change(screen.getByLabelText('Update'), { target: { value: 'And me' } })
      fireEvent.click(screen.getByRole('button', { name: 'Post update' }))

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(/couldn.t post your update/i)
      expect(screen.getByLabelText('Title')).toHaveValue('Keep me')
      expect(screen.getByLabelText('Update')).toHaveValue('And me')
      expect(within(document.body).queryByText('Update posted.')).not.toBeInTheDocument()
    })
  })
})
