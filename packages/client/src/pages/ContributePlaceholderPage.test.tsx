import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ContributePlaceholderPage } from './ContributePlaceholderPage'

describe('ContributePlaceholderPage', () => {
  it('renders "Coming Soon" heading', () => {
    render(
      <MemoryRouter initialEntries={['/contribute/1']}>
        <Routes>
          <Route path="/contribute/:id" element={<ContributePlaceholderPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Coming Soon' })).toBeInTheDocument()
  })

  it('renders back-link to campaign page', () => {
    render(
      <MemoryRouter initialEntries={['/contribute/1']}>
        <Routes>
          <Route path="/contribute/:id" element={<ContributePlaceholderPage />} />
        </Routes>
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: 'Back to Campaign' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/campaigns/1')
  })

  it('renders development message', () => {
    render(
      <MemoryRouter initialEntries={['/contribute/42']}>
        <Routes>
          <Route path="/contribute/:id" element={<ContributePlaceholderPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText(/contribution flow is currently in development/i)).toBeInTheDocument()
  })
})
