interface ProgressBarProps {
  value: number
  complete?: boolean
  label: string
  className?: string
}

const trackStyle: React.CSSProperties = {
  position: 'relative',
  height: '8px',
  background: 'var(--color-progress-track)',
  borderRadius: 'var(--radius-progress)',
  overflow: 'visible',
}

export function ProgressBar({ value, complete = false, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${clamped}%`,
    background: complete ? 'var(--color-progress-complete)' : 'var(--color-progress-fill)',
    borderRadius: 'var(--radius-progress)',
    transition: 'width var(--motion-enter)',
  }

  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    right: '-7px',
    transform: 'translateY(-50%)',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: 'var(--color-progress-indicator)',
    boxShadow: '0 0 12px var(--color-progress-indicator)',
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={className}
      style={trackStyle}
    >
      <div style={fillStyle}>{clamped > 0 && <div style={dotStyle} />}</div>
    </div>
  )
}
