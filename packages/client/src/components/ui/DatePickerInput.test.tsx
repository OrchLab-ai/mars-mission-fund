import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DatePickerInput } from './DatePickerInput'

describe('DatePickerInput', () => {
  it('renders label and input', () => {
    render(<DatePickerInput id="test-date" label="Test Date" value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument()
    const input = document.getElementById('test-date') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('date')
  })

  it('renders the label text', () => {
    render(
      <DatePickerInput id="test-date" label="Campaign Deadline" value="" onChange={() => {}} />
    )
    expect(screen.getByText('Campaign Deadline')).toBeInTheDocument()
  })

  it('renders helper text', () => {
    render(
      <DatePickerInput
        id="test-date"
        label="Test Date"
        value=""
        onChange={() => {}}
        helperText="Pick a date"
      />
    )
    expect(screen.getByText('Pick a date')).toBeInTheDocument()
  })

  it('forwards min and max attributes to the input', () => {
    render(
      <DatePickerInput
        id="test-date"
        label="Test Date"
        value=""
        onChange={() => {}}
        min="2026-01-01"
        max="2027-01-01"
      />
    )
    const input = document.getElementById('test-date') as HTMLInputElement
    expect(input).toHaveAttribute('min', '2026-01-01')
    expect(input).toHaveAttribute('max', '2027-01-01')
  })

  it('shows error span with role="alert" when error prop is set', () => {
    render(
      <DatePickerInput
        id="test-date"
        label="Test Date"
        value=""
        onChange={() => {}}
        error="Date is out of range"
      />
    )
    const errorSpan = screen.getByRole('alert')
    expect(errorSpan).toBeInTheDocument()
    expect(errorSpan).toHaveTextContent('Date is out of range')
  })

  it('does not render role="alert" when error prop is not set', () => {
    render(<DatePickerInput id="test-date" label="Test Date" value="" onChange={() => {}} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('error span is empty when error prop is cleared', () => {
    const { rerender } = render(
      <DatePickerInput
        id="test-date"
        label="Test Date"
        value=""
        onChange={() => {}}
        error="Some error"
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Some error')

    rerender(
      <DatePickerInput id="test-date" label="Test Date" value="" onChange={() => {}} error="" />
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('aria-describedby always includes both helper and error ids', () => {
    render(<DatePickerInput id="my-date" label="Test Date" value="" onChange={() => {}} />)
    const input = document.getElementById('my-date') as HTMLInputElement
    expect(input).toHaveAttribute('aria-describedby', 'my-date-helper my-date-error')
  })

  it('helper span is always rendered (even if empty) for stable aria-describedby', () => {
    render(<DatePickerInput id="my-date" label="Test Date" value="" onChange={() => {}} />)
    expect(document.getElementById('my-date-helper')).toBeInTheDocument()
    expect(document.getElementById('my-date-error')).toBeInTheDocument()
  })

  it('input has min-height of at least 44px via inline style', () => {
    render(<DatePickerInput id="test-date" label="Test Date" value="" onChange={() => {}} />)
    const input = document.getElementById('test-date') as HTMLInputElement
    expect(input.style.minHeight).toBe('44px')
  })

  it('calls onChange with the new value', () => {
    const handleChange = vi.fn()
    render(<DatePickerInput id="test-date" label="Test Date" value="" onChange={handleChange} />)
    const input = document.getElementById('test-date') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-06-15' } })
    expect(handleChange).toHaveBeenCalledWith('2026-06-15')
  })
})
