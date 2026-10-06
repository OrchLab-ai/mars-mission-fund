import { useRef, useEffect } from 'react'
import { CampaignCategorySchema } from '@mmf/shared'
import type { CampaignFilterParams } from '../../api/campaigns'

const CATEGORIES = CampaignCategorySchema.options

const cssOverrides = `
  .mmf-filters-bar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (min-width: 640px) {
    .mmf-filters-bar {
      flex-direction: row;
      align-items: flex-start;
      flex-wrap: wrap;
    }
  }
`

let filtersStyleInjected = false
function ensureFiltersStyle() {
  if (filtersStyleInjected || typeof document === 'undefined') return
  filtersStyleInjected = true
  const el = document.createElement('style')
  el.textContent = cssOverrides
  document.head.appendChild(el)
}

const searchInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--color-border-default)',
  background: 'var(--color-surface-elevated)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  minWidth: '200px',
  outline: 'none',
}

const pillsWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  flex: 1,
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 12px',
    borderRadius: '999px',
    border: active
      ? '1px solid var(--color-brand-primary)'
      : '1px solid var(--color-border-default)',
    background: active ? 'var(--color-brand-primary)' : 'var(--color-surface-elevated)',
    color: active ? 'var(--color-text-on-brand)' : 'var(--color-text-primary)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'var(--type-body)',
  }
}

const clearButtonStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '6px',
  border: '1px solid var(--color-border-default)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'var(--type-body)',
  alignSelf: 'flex-start',
}

interface CampaignFiltersProps {
  filters: CampaignFilterParams
  onFiltersChange: (f: CampaignFilterParams) => void
}

export function CampaignFilters({ filters, onFiltersChange }: CampaignFiltersProps) {
  ensureFiltersStyle()

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync controlled input value when filters.search changes externally
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== (filters.search ?? '')) {
      inputRef.current.value = filters.search ?? ''
    }
  }, [filters.search])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined })
    }, 300)
  }

  function toggleCategory(category: string) {
    const current = filters.categories ?? []
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    onFiltersChange({ ...filters, categories: next.length > 0 ? next : undefined })
  }

  function clearFilters() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (inputRef.current) inputRef.current.value = ''
    onFiltersChange({})
  }

  const hasActiveFilters = !!(
    (filters.search && filters.search.length > 0) ||
    (filters.categories && filters.categories.length > 0)
  )

  return (
    <div className="mmf-filters-bar" aria-label="Campaign filters">
      <input
        ref={inputRef}
        type="search"
        aria-label="Search campaigns"
        placeholder="Search missions…"
        defaultValue={filters.search ?? ''}
        onChange={handleSearchChange}
        style={searchInputStyle}
      />
      <div style={pillsWrapperStyle} role="group" aria-label="Filter by category">
        {CATEGORIES.map((category) => {
          const active = (filters.categories ?? []).includes(category)
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              onClick={() => toggleCategory(category)}
              style={pillStyle(active)}
            >
              {category}
            </button>
          )
        })}
      </div>
      {hasActiveFilters && (
        <button type="button" onClick={clearFilters} style={clearButtonStyle}>
          Clear filters
        </button>
      )}
    </div>
  )
}
