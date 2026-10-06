import { Button } from './ui/Button'

const sectionStyle: React.CSSProperties = {
  position: 'relative',
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--gradient-hero)',
  overflow: 'hidden',
  padding: '0 24px',
}

const contentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
  maxWidth: '900px',
  width: '100%',
}

const subtextStyle: React.CSSProperties = {
  fontFamily: 'var(--type-body)',
  color: 'var(--color-text-secondary)',
  fontSize: '18px',
  lineHeight: 1.6,
  margin: '24px auto 40px',
  maxWidth: '600px',
}

const glowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '800px',
  height: '800px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, var(--color-status-active-bg) 0%, transparent 70%)',
  pointerEvents: 'none',
}

const heroHeadingClass = 'hero-heading'

const heroStyles = `
  .${heroHeadingClass} {
    font-family: var(--type-hero);
    color: var(--color-text-primary);
    font-size: 32px;
    line-height: 1;
    letter-spacing: var(--type-hero-spacing);
    margin: 0;
    text-transform: uppercase;
  }
  @media (min-width: 640px) {
    .${heroHeadingClass} {
      font-size: 48px;
    }
  }
  @media (min-width: 768px) {
    .${heroHeadingClass} {
      font-size: 72px;
    }
  }
  @media (min-width: 1280px) {
    .${heroHeadingClass} {
      font-size: 96px;
    }
  }
  .hero-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 800px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--color-status-active-bg) 0%, transparent 70%);
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-glow {
      opacity: 0;
    }
  }
`

let heroStyleInjected = false

function ensureHeroStyle() {
  if (heroStyleInjected || typeof document === 'undefined') return
  heroStyleInjected = true
  const el = document.createElement('style')
  el.textContent = heroStyles
  document.head.appendChild(el)
}

export function HeroSection() {
  ensureHeroStyle()

  return (
    <section style={sectionStyle} aria-label="Hero">
      <div className="hero-glow" aria-hidden="true" style={glowStyle} />
      <div style={contentStyle}>
        <h1 className={heroHeadingClass}>Crowdfunding the Next Giant Leap</h1>
        <p style={subtextStyle}>
          Mars Mission Fund connects visionary space projects with the backers who believe in
          humanity&apos;s multiplanetary future. Every pledge moves the launch window closer.
        </p>
        <Button variant="primary" href="/campaigns">
          Explore Missions
        </Button>
      </div>
    </section>
  )
}
