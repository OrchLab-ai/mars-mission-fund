import type { CSSProperties } from 'react'
import { SectionLabel } from '../components/ui/SectionLabel'
import { Card } from '../components/ui/Card'

const sectionStyle: CSSProperties = {
  padding: '80px 24px',
  background: 'var(--color-bg-surface)',
}

const altSectionStyle: CSSProperties = {
  padding: '80px 24px',
  background: 'var(--color-bg-page)',
}

const innerStyle: CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '36px',
  color: 'var(--color-text-primary)',
  marginBottom: '32px',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
}

const cardTitleStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '8px',
}

const cardValueStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '16px',
  color: 'var(--color-text-primary)',
  lineHeight: '1.6',
}

const socialLinkStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--type-body)',
  fontSize: '15px',
  color: 'var(--color-text-accent)',
  textDecoration: 'none',
  marginTop: '8px',
}

const socialPlatformTitleStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '18px',
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  marginBottom: '4px',
}

const socialHandleStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
}

const socialPlatforms = [
  {
    platform: 'X / Twitter',
    handle: '@MarsMissionFund',
    href: 'https://twitter.com/MarsMissionFund',
  },
  {
    platform: 'LinkedIn',
    handle: 'Mars Mission Fund',
    href: 'https://linkedin.com/company/marsmissionfund',
  },
  {
    platform: 'YouTube',
    handle: 'Mars Mission Fund',
    href: 'https://youtube.com/@MarsMissionFund',
  },
  {
    platform: 'Instagram',
    handle: '@marsmissionfund',
    href: 'https://instagram.com/marsmissionfund',
  },
]

export function ContactPage() {
  return (
    <>
      {/* Section 1: Contact Details */}
      <section style={sectionStyle} aria-labelledby="contact-heading">
        <div style={innerStyle}>
          <SectionLabel number="01" title="GET IN TOUCH" />
          <h2 id="contact-heading" style={headingStyle}>
            WE&apos;D LOVE TO HEAR FROM YOU
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card accent>
              <dl>
                <div style={{ marginBottom: '24px' }}>
                  <dt style={cardTitleStyle}>Email</dt>
                  <dd>
                    <a
                      href="mailto:missions@marsmissionfund.com"
                      style={cardValueStyle}
                      aria-label="Send email to missions@marsmissionfund.com"
                    >
                      missions@marsmissionfund.com
                    </a>
                  </dd>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <dt style={cardTitleStyle}>Address</dt>
                  <dd style={cardValueStyle}>
                    Mars Mission Fund HQ
                    <br />
                    1 Launchpad Drive, Suite 42
                    <br />
                    Cape Canaveral, FL 32920
                    <br />
                    United States
                  </dd>
                </div>
                <div>
                  <dt style={cardTitleStyle}>Office Hours</dt>
                  <dd style={cardValueStyle}>Monday–Friday, 09:00–18:00 UTC</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <p
                style={{
                  fontFamily: 'var(--type-body)',
                  fontSize: '16px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.7',
                  marginBottom: '16px',
                }}
              >
                Whether you&apos;re a mission team looking for capital, a backer seeking
                opportunities, or simply a believer in humanity&apos;s multi-planetary future — we
                want to hear from you.
              </p>
              <p
                style={{
                  fontFamily: 'var(--type-body)',
                  fontSize: '16px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.7',
                }}
              >
                Our team responds to all enquiries within two business days. For urgent
                mission-critical matters, please mark your subject line with &quot;PRIORITY&quot;.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: Social Links */}
      <section style={altSectionStyle} aria-labelledby="social-heading">
        <div style={innerStyle}>
          <SectionLabel number="02" title="FOLLOW THE MISSION" />
          <h2 id="social-heading" style={headingStyle}>
            JOIN US ON SOCIAL
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {socialPlatforms.map(({ platform, handle, href }) => (
              <Card key={platform} accent>
                <p style={socialPlatformTitleStyle}>{platform}</p>
                <p style={socialHandleStyle}>{handle}</p>
                <a
                  href={href}
                  style={socialLinkStyle}
                  aria-label={`Follow Mars Mission Fund on ${platform} at ${handle}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Follow us →
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
