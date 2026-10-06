import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Header } from './Header'

vi.mock('../context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useLogout: vi.fn(() => ({ mutate: vi.fn() })),
}))

vi.mock('./NotificationBell', () => ({
  NotificationBell: () => null,
}))

import { useAuthContext } from '../context/AuthContext'

const makeUser = (role: string) => ({
  id: '1',
  email: 'user@example.com',
  displayName: 'Test User',
  bio: null,
  role: role as 'Backer' | 'Creator' | 'Reviewer' | 'Administrator' | 'SuperAdministrator',
  createdAt: new Date(),
  updatedAt: new Date(),
})

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  )
}

describe('Header — Dashboard link visibility', () => {
  it('shows Dashboard link for Creator role (desktop)', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Creator'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    const links = screen.getAllByRole('link', { name: 'Dashboard' })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('hides Dashboard link for Backer role', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Backer'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('hides Dashboard link for Reviewer role', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Reviewer'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('hides Dashboard link when unauthenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('shows Dashboard link in mobile nav for Creator role', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Creator'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()

    // Hamburger button has display:none via inline style in jsdom — query directly
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    // Both desktop and mobile Dashboard links are now rendered
    const links = screen.getAllByRole('link', { name: 'Dashboard' })
    expect(links.length).toBe(2)
  })
})

describe('Header — Notifications link visibility', () => {
  it('shows Notifications link for authenticated Backer', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Backer'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('shows Notifications link for authenticated Creator', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Creator'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    const links = screen.getAllByRole('link', { name: 'Notifications' })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Notifications link for authenticated Reviewer', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Reviewer'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('shows Notifications link for authenticated Administrator', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Administrator'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    const links = screen.getAllByRole('link', { name: 'Notifications' })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('hides Notifications link when unauthenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    expect(screen.queryByRole('link', { name: 'Notifications' })).not.toBeInTheDocument()
  })

  it('clicking Notifications link closes the mobile nav', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Backer'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    const link = screen.getByRole('link', { name: 'Notifications' })
    fireEvent.click(link)

    expect(screen.queryByRole('link', { name: 'Notifications' })).not.toBeInTheDocument()
  })
})

describe('Header — Admin link visibility', () => {
  it('shows Admin link for Administrator role (desktop)', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Administrator'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    const links = screen.getAllByRole('link', { name: 'Admin' })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Admin link for SuperAdministrator role (desktop)', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('SuperAdministrator'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    const links = screen.getAllByRole('link', { name: 'Admin' })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('hides Admin link for Backer role', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Backer'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('hides Admin link when unauthenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('shows Admin link in mobile nav for Administrator role', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: makeUser('Administrator'),
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderHeader()

    // Hamburger button has display:none via inline style in jsdom — query directly
    const hamburger = container.querySelector('[aria-label="Toggle navigation"]') as HTMLElement
    fireEvent.click(hamburger)

    // Both desktop and mobile Admin links are now rendered
    const links = screen.getAllByRole('link', { name: 'Admin' })
    expect(links.length).toBe(2)
  })
})
