import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LoginPage } from './LoginPage'

vi.mock('../context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useLogin: vi.fn(),
}))

import { useAuthContext } from '../context/AuthContext'
import { useLogin } from '../hooks/useAuth'

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  it('renders demo user cards', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useLogin).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogin>)

    renderLoginPage()

    expect(screen.getByText('Demo Backer')).toBeInTheDocument()
    expect(screen.getByText('Demo Creator')).toBeInTheDocument()
    expect(screen.getByText('Demo Admin')).toBeInTheDocument()
    expect(screen.getByText('backer@example.com')).toBeInTheDocument()
    expect(screen.getByText('creator@example.com')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('pre-fills credentials when demo user card is clicked', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useLogin).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogin>)

    renderLoginPage()

    // Click the Demo Backer demo card
    fireEvent.click(screen.getByRole('button', { name: /demo backer/i }))

    expect(screen.getByLabelText(/email/i)).toHaveValue('backer@example.com')
    expect(screen.getByLabelText(/password/i)).toHaveValue('backer-demo-pass')
  })

  it('calls login mutation on form submit', () => {
    const mockMutate = vi.fn()
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useLogin).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogin>)

    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'testpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'testpass' },
      expect.any(Object)
    )
  })

  it('displays error message on failed login', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useLogin).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error('Invalid credentials'),
    } as unknown as ReturnType<typeof useLogin>)

    renderLoginPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('redirects when already authenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'alice@example.com',
        displayName: 'Alice',
        bio: null,
        role: 'Backer',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useLogin).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogin>)

    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    )

    // The page renders a Navigate redirect so the login form is not shown
    expect(screen.queryByText(/log in/i)).not.toBeInTheDocument()
    expect(container).toBeDefined()
  })
})
