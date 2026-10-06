interface DatePickerInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  helperText?: string
  error?: string
  required?: boolean
}

const inputBaseStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  minHeight: '44px',
  padding: '10px 12px',
  borderRadius: '6px',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-input)',
  boxSizing: 'border-box',
  cursor: 'pointer',
}

const inputErrorStyle: React.CSSProperties = {
  ...inputBaseStyle,
  border: '1px solid var(--color-status-error)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

const helperStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  fontSize: '12px',
  color: 'var(--color-text-tertiary)',
}

const errorStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  fontSize: '12px',
  color: 'var(--color-text-error)',
}

export function DatePickerInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  helperText,
  error,
  required,
}: DatePickerInputProps) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        type="date"
        id={id}
        value={value}
        min={min}
        max={max}
        required={required}
        aria-describedby={`${id}-helper ${id}-error`}
        style={error ? inputErrorStyle : inputBaseStyle}
        onChange={(e) => onChange(e.target.value)}
      />
      <span id={`${id}-helper`} style={helperStyle}>
        {helperText ?? ''}
      </span>
      <span id={`${id}-error`} role={error ? 'alert' : undefined} style={errorStyle}>
        {error ?? ''}
      </span>
    </div>
  )
}
