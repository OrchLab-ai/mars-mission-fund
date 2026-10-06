import { useId } from 'react'

type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  size?: LogoSize
  'aria-label'?: string
  className?: string
}

const sizeMap: Record<LogoSize, number> = {
  sm: 32,
  md: 72,
  lg: 120,
}

export function Logo({
  size = 'sm',
  'aria-label': ariaLabel = 'Mars Mission Fund',
  className,
}: LogoProps) {
  const id = useId().replace(/:/g, '')
  const px = sizeMap[size]

  const coinGrad = `${id}coinGrad`
  const coinInner = `${id}coinInner`
  const marsGrad = `${id}marsGrad`

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <defs>
        <radialGradient id={coinGrad} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#E8EDF5" />
          <stop offset="40%" stopColor="#C8D0DC" />
          <stop offset="75%" stopColor="#8A96A8" />
          <stop offset="100%" stopColor="#5A6475" />
        </radialGradient>
        <radialGradient id={coinInner} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1A3A6E" />
          <stop offset="50%" stopColor="#0B1628" />
          <stop offset="100%" stopColor="#060A14" />
        </radialGradient>
        <radialGradient id={marsGrad} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FF8C42" />
          <stop offset="45%" stopColor="#C1440E" />
          <stop offset="100%" stopColor="#7A2A0A" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="60" cy="60" r="58" fill={`url(#${coinGrad})`} opacity="0.3" />
      {/* Coin body */}
      <circle cx="60" cy="60" r="52" fill={`url(#${coinGrad})`} />
      {/* Inner recess */}
      <circle cx="60" cy="60" r="44" fill={`url(#${coinInner})`} />
      {/* Ridge detail */}
      <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(200,208,220,0.15)" strokeWidth="1" />
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="rgba(200,208,220,0.08)"
        strokeWidth="0.5"
      />
      {/* Mars planet */}
      <circle cx="60" cy="60" r="24" fill={`url(#${marsGrad})`} />
      {/* Mars surface details */}
      <ellipse
        cx="52"
        cy="56"
        rx="5"
        ry="3"
        fill="rgba(90,30,10,0.5)"
        transform="rotate(-15,52,56)"
      />
      <ellipse
        cx="68"
        cy="58"
        rx="4"
        ry="2"
        fill="rgba(90,30,10,0.4)"
        transform="rotate(10,68,58)"
      />
      <ellipse
        cx="60"
        cy="50"
        rx="7"
        ry="2.5"
        fill="rgba(255,140,66,0.4)"
        transform="rotate(-5,60,50)"
      />
      <ellipse
        cx="57"
        cy="68"
        rx="3"
        ry="2"
        fill="rgba(90,30,10,0.3)"
        transform="rotate(20,57,68)"
      />
      {/* Mars polar cap */}
      <ellipse cx="60" cy="38" rx="6" ry="2.5" fill="rgba(220,230,245,0.4)" />
      {/* Orbital ring */}
      <ellipse
        cx="60"
        cy="60"
        rx="32"
        ry="10"
        fill="none"
        stroke="rgba(200,208,220,0.25)"
        strokeWidth="1"
        strokeDasharray="3 2"
        transform="rotate(-25,60,60)"
      />
      {/* Coin shine highlight */}
      <ellipse
        cx="46"
        cy="36"
        rx="14"
        ry="8"
        fill="rgba(255,255,255,0.12)"
        transform="rotate(-20,46,36)"
      />
      {/* Star details in rim */}
      <text
        x="60"
        y="15"
        textAnchor="middle"
        fontSize="7"
        fill="rgba(200,208,220,0.4)"
        fontFamily="serif"
        fontWeight="bold"
      >
        ★
      </text>
      <text
        x="60"
        y="109"
        textAnchor="middle"
        fontSize="7"
        fill="rgba(200,208,220,0.4)"
        fontFamily="serif"
        fontWeight="bold"
      >
        ★
      </text>
    </svg>
  )
}
