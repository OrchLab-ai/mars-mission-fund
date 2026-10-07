import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import type { User } from '@mmf/shared'
import { MissionUpdatesSection } from './MissionUpdatesSection'
import type { MissionUpdate } from '../../api/proposals'

const mockHook = vi.fn()

vi.mock('../../hooks/useMissionUpdates', () => ({
  useMissionUpdates: (id: string) => mockHook(id),
}))

const mockMutate = vi.fn()
let mockPending = false

vi.mock('../../hooks/useCreateMissionUpdate', () => ({
  useCreateMissionUpdate: () => ({ mutate: mockMutate, isPending: mockPending }),
}))

const CREATOR_ID = '22222222-2222-2222-2222-222222222222'

function makeUpdate(overrides: Partial<MissionUpdate> = {}): MissionUpdate {
  return {
    id: '00000000-0003-0000-0000-000000000001',
    title: 'Prototype build is underway',
    body: 'First line',
    authorId: CREATOR_ID,
    authorName: 'Demo Creator',
    createdAt: new Date('2026-09-20T10:00:00.000Z'),
    ...overrides,
  }
}

function makeUser(id: string, role: User['role'] = 'Creator'): User {
  return { id, email: 'someone@example.com', role, displayName: 'Someone' } as User
}

function setHook(state: Partial<{ data: MissionUpdate[]; isLoading: boolean; isError: boolean }>) {
  mockHook.mockReturnValue({ data: undefined, isLoading: false, isError: false, ...state })
}

function renderSection(user: User | null = null) {
  return render(<MissionUpdatesSection proposalId="p1" creatorId={CREATOR_ID} user={user} />)
}

const READER_EMPTY = 'No updates yet. When the crew posts progress, it lands here first.'
const CREATOR_EMPTY = 'Your crew is waiting to hear from you. Post the first update above.'
const LOAD_ERROR = "We couldn't load the updates right now. Refresh the page to try again."

describe('MissionUpdatesSection', () => {
  beforeEach(() => {
    mockHook.mockReset()
    mockMutate.mockReset()
    mockPending = false
  })

  describe('post form', () => {
    it('is absent when signed out, as a Backer, and as a non-owning Creator', () => {
      setHook({ data: [] })
      const { unmount: u1 } = renderSection(null)
      expect(screen.queryByRole('button', { name: 'Post update' })).toBeNull()
      u1()
      const { unmount: u2 } = renderSection(makeUser(CREATOR_ID, 'Backer'))
      expect(screen.queryByRole('button', { name: 'Post update' })).toBeNull()
      u2()
      renderSection(makeUser('someone-else', 'Creator'))
      expect(screen.queryByRole('button', { name: 'Post update' })).toBeNull()
      expect(screen.queryByLabelText('Title')).toBeNull()
    })

    it('is shown to the owning creator, above the list, with labels and help text wired', () => {
      setHook({ data: [makeUpdate()] })
      renderSection(makeUser(CREATOR_ID))
      const title = screen.getByLabelText('Title')
      const body = screen.getByLabelText("What's happening?")
      expect(title.getAttribute('maxlength')).toBe('120')
      expect(body.getAttribute('maxlength')).toBe('5000')
      const titleHelp = document.getElementById(title.getAttribute('aria-describedby')!)
      const bodyHelp = document.getElementById(body.getAttribute('aria-describedby')!)
      expect(titleHelp?.textContent).toBe('Keep it short, like a headline. Up to 120 characters.')
      expect(bodyHelp?.textContent).toBe(
        "Progress, setbacks, what's next. Plain text, up to 5,000 characters."
      )
      const form = screen.getByRole('button', { name: 'Post update' }).closest('form')!
      const list = screen.getByRole('list')
      expect(form.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('disables the button while a post is in flight', () => {
      setHook({ data: [] })
      mockPending = true
      renderSection(makeUser(CREATOR_ID))
      expect(
        (screen.getByRole('button', { name: 'Post update' }) as HTMLButtonElement).disabled
      ).toBe(true)
    })

    it('posts the typed values and clears the form on success', () => {
      setHook({ data: [] })
      mockMutate.mockImplementation((_data, opts) => opts.onSuccess())
      renderSection(makeUser(CREATOR_ID))
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Big news' } })
      fireEvent.change(screen.getByLabelText("What's happening?"), {
        target: { value: 'Line one\nLine two' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Post update' }))
      expect(mockMutate.mock.calls[0]![0]).toEqual({
        title: 'Big news',
        body: 'Line one\nLine two',
      })
      expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText("What's happening?") as HTMLTextAreaElement).value).toBe('')
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('shows the failure message and keeps the text when a post fails', () => {
      setHook({ data: [] })
      mockMutate.mockImplementation((_data, opts) => opts.onError(new Error('HTTP 500')))
      renderSection(makeUser(CREATOR_ID))
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Big news' } })
      fireEvent.change(screen.getByLabelText("What's happening?"), { target: { value: 'Body' } })
      fireEvent.click(screen.getByRole('button', { name: 'Post update' }))
      expect(screen.getByRole('alert').textContent).toBe(
        "That update didn't go through. Your text is still here, so try posting again."
      )
      expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Big news')
      expect((screen.getByLabelText("What's happening?") as HTMLTextAreaElement).value).toBe('Body')
    })
  })

  it('is a labelled region found by its heading', () => {
    setHook({ data: [] })
    renderSection()
    const region = screen.getByRole('region', { name: 'Mission updates' })
    expect(within(region).getByRole('heading', { level: 3, name: 'Mission updates' })).toBeTruthy()
  })

  it('reads the updates for the given proposal', () => {
    setHook({ data: [] })
    renderSection()
    expect(mockHook).toHaveBeenCalledWith('p1')
  })

  it('renders updates in the order given', () => {
    setHook({
      data: [
        makeUpdate({ id: 'u2', title: 'Newer update' }),
        makeUpdate({ id: 'u1', title: 'Older update' }),
      ],
    })
    renderSection()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]!).getByText('Newer update')).toBeTruthy()
    expect(within(items[1]!).getByText('Older update')).toBeTruthy()
  })

  it('shows the author, and a time element for the date', () => {
    setHook({ data: [makeUpdate()] })
    renderSection()
    const item = screen.getByRole('listitem')
    expect(within(item).getByText(/Demo Creator/)).toBeTruthy()
    const time = item.querySelector('time')
    expect(time).not.toBeNull()
    expect(time?.getAttribute('datetime')).toBe('2026-09-20T10:00:00.000Z')
  })

  it('shows "Mission crew" for a null author', () => {
    setHook({ data: [makeUpdate({ authorName: null })] })
    renderSection()
    expect(screen.getByText(/Mission crew/)).toBeTruthy()
  })

  it('keeps line breaks in the body', () => {
    setHook({ data: [makeUpdate({ body: 'Line one\nLine two' })] })
    renderSection()
    const body = screen.getByText(/Line one/)
    expect(body.textContent).toBe('Line one\nLine two')
    expect(body.style.whiteSpace).toBe('pre-wrap')
  })

  it('renders markup in the body as literal text', () => {
    setHook({ data: [makeUpdate({ body: '<b>x</b>' })] })
    const { container } = renderSection()
    expect(screen.getByText('<b>x</b>')).toBeTruthy()
    expect(container.querySelector('b')).toBeNull()
  })

  it('shows the reader empty state with no list', () => {
    setHook({ data: [] })
    renderSection()
    expect(screen.getByText(READER_EMPTY)).toBeTruthy()
    expect(screen.queryByText(CREATOR_EMPTY)).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows the creator empty state to the owning creator', () => {
    setHook({ data: [] })
    renderSection(makeUser(CREATOR_ID))
    expect(screen.getByText(CREATOR_EMPTY)).toBeTruthy()
    expect(screen.queryByText(READER_EMPTY)).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows the reader empty state to a non-owner or signed-out visitor', () => {
    setHook({ data: [] })
    const { unmount } = renderSection(makeUser('someone-else'))
    expect(screen.getByText(READER_EMPTY)).toBeTruthy()
    expect(screen.queryByText(CREATOR_EMPTY)).toBeNull()
    unmount()

    renderSection(null)
    expect(screen.getByText(READER_EMPTY)).toBeTruthy()
    expect(screen.queryByText(CREATOR_EMPTY)).toBeNull()
  })

  it('shows the load failure message', () => {
    setHook({ isError: true })
    renderSection()
    expect(screen.getByText(LOAD_ERROR)).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows a loading message while loading', () => {
    setHook({ isLoading: true })
    renderSection()
    expect(screen.getByText('Loading updates…')).toBeTruthy()
  })

  it('uses no exclamation marks or forbidden words in its copy', () => {
    const forbidden =
      /donat|revolutionary|game-changing|stakeholder|contribution tier|pledge level|invest|guaranteed returns|exciting opportunity|last chance|hurry|click here|click to learn more/i
    const copy: string[] = []

    setHook({ data: [] })
    copy.push(renderSection().container.textContent ?? '')
    copy.push(renderSection(makeUser(CREATOR_ID)).container.textContent ?? '')
    mockMutate.mockImplementation((_data, opts) => opts.onError(new Error('x')))
    const owner = renderSection(makeUser(CREATOR_ID))
    const form = within(owner.container)
    fireEvent.change(form.getByLabelText('Title'), { target: { value: 't' } })
    fireEvent.change(form.getByLabelText("What's happening?"), { target: { value: 'b' } })
    fireEvent.click(form.getByRole('button', { name: 'Post update' }))
    copy.push(owner.container.textContent ?? '')
    setHook({ isError: true })
    copy.push(renderSection().container.textContent ?? '')
    setHook({ isLoading: true })
    copy.push(renderSection().container.textContent ?? '')

    for (const text of copy) {
      expect(text).not.toContain('!')
      expect(text).not.toMatch(forbidden)
    }
  })
})
