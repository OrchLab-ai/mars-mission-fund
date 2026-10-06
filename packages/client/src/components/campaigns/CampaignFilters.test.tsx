import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CampaignFilters } from './CampaignFilters'
import { CampaignCategorySchema } from '@mmf/shared'
import type { CampaignFilterParams } from '../../api/campaigns'

const CATEGORIES = CampaignCategorySchema.options

describe('CampaignFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all category pills', () => {
    render(<CampaignFilters filters={{}} onFiltersChange={vi.fn()} />)
    for (const category of CATEGORIES) {
      expect(screen.getByRole('button', { name: category })).toBeInTheDocument()
    }
  })

  it('calls onFiltersChange with search value after 300 ms debounce', () => {
    const onFiltersChange = vi.fn()
    render(<CampaignFilters filters={{}} onFiltersChange={onFiltersChange} />)
    const input = screen.getByRole('searchbox', { name: /search campaigns/i })
    fireEvent.change(input, { target: { value: 'propulsion' } })
    expect(onFiltersChange).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onFiltersChange).toHaveBeenCalledWith({ search: 'propulsion' })
  })

  it('does not call onFiltersChange before debounce fires', () => {
    const onFiltersChange = vi.fn()
    render(<CampaignFilters filters={{}} onFiltersChange={onFiltersChange} />)
    const input = screen.getByRole('searchbox', { name: /search campaigns/i })
    fireEvent.change(input, { target: { value: 'test' } })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(onFiltersChange).not.toHaveBeenCalled()
  })

  it('clicking a category pill calls onFiltersChange with that category added', () => {
    const onFiltersChange = vi.fn()
    render(<CampaignFilters filters={{}} onFiltersChange={onFiltersChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Propulsion' }))
    expect(onFiltersChange).toHaveBeenCalledWith({ categories: ['Propulsion'] })
  })

  it('clicking an active category pill removes it from the array', () => {
    const filters: CampaignFilterParams = { categories: ['Propulsion'] }
    const onFiltersChange = vi.fn()
    render(<CampaignFilters filters={filters} onFiltersChange={onFiltersChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Propulsion' }))
    expect(onFiltersChange).toHaveBeenCalledWith({ categories: undefined })
  })

  it('active category pill has aria-pressed=true', () => {
    const filters: CampaignFilterParams = { categories: ['Propulsion'] }
    render(<CampaignFilters filters={filters} onFiltersChange={vi.fn()} />)
    const pill = screen.getByRole('button', { name: 'Propulsion' })
    expect(pill).toHaveAttribute('aria-pressed', 'true')
  })

  it('inactive category pill has aria-pressed=false', () => {
    render(<CampaignFilters filters={{}} onFiltersChange={vi.fn()} />)
    const pill = screen.getByRole('button', { name: 'Propulsion' })
    expect(pill).toHaveAttribute('aria-pressed', 'false')
  })

  it('"Clear filters" button is hidden when no filters are active', () => {
    render(<CampaignFilters filters={{}} onFiltersChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()
  })

  it('"Clear filters" button appears when search is active', () => {
    render(<CampaignFilters filters={{ search: 'test' }} onFiltersChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('"Clear filters" button appears when categories are active', () => {
    render(<CampaignFilters filters={{ categories: ['Propulsion'] }} onFiltersChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('clicking "Clear filters" resets to empty filters', () => {
    const onFiltersChange = vi.fn()
    render(
      <CampaignFilters
        filters={{ search: 'foo', categories: ['Propulsion'] }}
        onFiltersChange={onFiltersChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(onFiltersChange).toHaveBeenCalledWith({})
  })
})
