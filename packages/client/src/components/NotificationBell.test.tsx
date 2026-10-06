import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NotificationBell } from './NotificationBell'
import type { Notification } from '../api/notifications'

vi.mock('../context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}))

import { useAuthContext } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const mockAuthContext = {
  isAuthenticated: true,
  user: {
    id: 'u1',
    email: 'test@example.com',
    displayName: 'Tester',
    bio: null,
    role: 'Backer' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  token: 'token123',
  login: vi.fn(),
  logout: vi.fn(),
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    userId: 'u1',
    type: 'campaign_approved',
    campaignId: null,
    title: 'Campaign approved',
    message: 'Your campaign was approved.',
    read: false,
    createdAt: new Date('2026-03-19T10:00:00.000Z'),
  },
  {
    id: 'n2',
    userId: 'u1',
    type: 'milestone_verified',
    campaignId: 'c1',
    title: 'Milestone verified',
    message: 'Milestone 1 has been verified.',
    read: true,
    createdAt: new Date('2026-03-18T10:00:00.000Z'),
  },
]

function mockQueryClient() {
  const invalidateQueries = vi.fn().mockResolvedValue(undefined)
  vi.mocked(useQueryClient).mockReturnValue({
    invalidateQueries,
  } as unknown as ReturnType<typeof useQueryClient>)
  return { invalidateQueries }
}

function mockMutation() {
  const mutate = vi.fn()
  vi.mocked(useMutation).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useMutation>)
  return mutate
}

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  )
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryClient()
    mockMutation()
  })

  it('renders nothing when unauthenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false,
      user: null,
      token: null,
    })
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>)

    const { container } = renderBell()
    expect(container.firstChild).toBeNull()
  })

  it('shows unread badge with correct count when notifications exist', () => {
    vi.mocked(useAuthContext).mockReturnValue(mockAuthContext)
    vi.mocked(useQuery).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>)

    renderBell()

    // 1 unread notification
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notifications.*1 unread/i })).toBeInTheDocument()
  })

  it('does not show badge when all notifications are read', () => {
    vi.mocked(useAuthContext).mockReturnValue(mockAuthContext)
    vi.mocked(useQuery).mockReturnValue({
      data: [{ ...mockNotifications[0], read: true }, mockNotifications[1]],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>)

    renderBell()

    expect(screen.queryByText('2')).not.toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('clicking the bell toggles the dropdown', () => {
    vi.mocked(useAuthContext).mockReturnValue(mockAuthContext)
    vi.mocked(useQuery).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>)

    renderBell()

    // Dropdown should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Click bell to open
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument()
    expect(screen.getByText('Campaign approved')).toBeInTheDocument()
    expect(screen.getByText('Milestone verified')).toBeInTheDocument()

    // Click bell again to close
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows "View all" link to /notifications in dropdown', () => {
    vi.mocked(useAuthContext).mockReturnValue(mockAuthContext)
    vi.mocked(useQuery).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>)

    renderBell()

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    const viewAll = screen.getByRole('link', { name: 'View all' })
    expect(viewAll).toBeInTheDocument()
    expect(viewAll).toHaveAttribute('href', '/notifications')
  })

  it('"Mark as read" button triggers mutation for unread notifications', () => {
    const mutate = mockMutation()
    vi.mocked(useAuthContext).mockReturnValue(mockAuthContext)
    vi.mocked(useQuery).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>)

    renderBell()

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    const markReadBtn = screen.getByRole('button', { name: /mark as read: campaign approved/i })
    fireEvent.click(markReadBtn)

    expect(mutate).toHaveBeenCalled()
  })

  it('shows empty state when no notifications', () => {
    vi.mocked(useAuthContext).mockReturnValue(mockAuthContext)
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useQuery>)

    renderBell()

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByText('No notifications yet.')).toBeInTheDocument()
  })
})
