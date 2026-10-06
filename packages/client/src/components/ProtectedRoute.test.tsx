import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

import { useAuthContext } from '../context/AuthContext'

const mockUser = {
  id: '1',
  email: 'alice@example.com',
  displayName: 'Alice',
  bio: null,
  role: 'Backer' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const adminUser = {
  id: '2',
  email: 'admin@example.com',
  displayName: 'Admin',
  bio: null,
  role: 'Administrator' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected content</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to / when authenticated but not admin and requireAdmin is set', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token123',
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<div>Admin content</div>} />
          </Route>
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Home page')).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      token: 'token123',
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected content</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders children when authenticated as admin with requireAdmin', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: adminUser,
      token: 'token123',
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<div>Admin content</div>} />
          </Route>
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })
})
