import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ProfilePage } from './ProfilePage'

vi.mock('../context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useUpdateProfile: vi.fn(),
}))

import { useAuthContext } from '../context/AuthContext'
import { useUpdateProfile } from '../hooks/useAuth'

const mockUser = {
  id: '1',
  email: 'alice@example.com',
  displayName: 'Alice',
  bio: 'Hello world',
  role: 'Backer' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function renderProfilePage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  )
}

describe('ProfilePage', () => {
  it('displays user email and role', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      isSuccess: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateProfile>)

    renderProfilePage()

    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Backer')).toBeInTheDocument()
  })

  it('pre-populates edit form with current display name and bio', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      isSuccess: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateProfile>)

    renderProfilePage()

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument()
  })

  it('calls updateProfile mutation on form submit', () => {
    const mockMutate = vi.fn()
    const mockReset = vi.fn()
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
      isSuccess: false,
      reset: mockReset,
    } as unknown as ReturnType<typeof useUpdateProfile>)

    renderProfilePage()

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'New Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mockMutate).toHaveBeenCalledWith({ displayName: 'New Name', bio: 'Hello world' })
  })

  it('shows loading state when not authenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      isSuccess: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateProfile>)

    renderProfilePage()

    expect(screen.getByText('Loading profile…')).toBeInTheDocument()
  })

  it('displays success message after successful update', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      isSuccess: true,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateProfile>)

    renderProfilePage()

    expect(screen.getByRole('status')).toHaveTextContent('Profile updated successfully.')
  })
})
