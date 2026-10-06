import { type CSSProperties, type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useLogin } from '../hooks/useAuth'
import { useAuthContext } from '../context/AuthContext'

interface DemoUser {
  name: string
  email: string
  password: string
  role: string
}

const DEMO_USERS: DemoUser[] = [
  {
    name: 'Demo Backer',
    email: 'backer@example.com',
    password: 'backer-demo-pass',
    role: 'Backer',
  },
  {
    name: 'Demo Creator',
    email: 'creator@example.com',
    password: 'creator-demo-pass',
    role: 'Creator',
  },
  {
    name: 'Demo Admin',
    email: 'admin@example.com',
    password: 'admin-demo-pass',
    role: 'Administrator',
  },
  {
    name: 'Demo Reviewer',
    email: 'reviewer@example.com',
    password: 'reviewer-demo-pass',
    role: 'Reviewer',
  },
]

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-6)',
}

const containerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '440px',
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '32px',
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 'var(--space-2)',
}

const subtitleStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--space-8)',
}

const sectionLabelStyle: CSSProperties = {
  fontFamily: 'var(--type-label)',
  fontSize: '11px',
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 'var(--space-3)',
}

const demoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-8)',
}

const demoDividerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-6)',
}

const dividerLineStyle: CSSProperties = {
  flex: 1,
  height: '1px',
  background: 'var(--color-border-subtle)',
}

const dividerTextStyle: CSSProperties = {
  fontFamily: 'var(--type-label)',
  fontSize: '11px',
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  whiteSpace: 'nowrap',
}

const fieldGroupStyle: CSSProperties = {
  marginBottom: 'var(--space-4)',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--type-label)',
  fontSize: '11px',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
}

const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  padding: 'var(--space-3) var(--space-4)',
  fontFamily: 'var(--type-body)',
  fontSize: '15px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

const submitButtonStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 'var(--space-3) var(--space-6)',
  background: 'var(--color-text-accent)',
  color: 'var(--color-text-on-action)',
  border: 'none',
  borderRadius: 'var(--radius-button)',
  fontFamily: 'var(--type-body)',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 'var(--space-6)',
}

const errorStyle: CSSProperties = {
  fontFamily: 'var(--type-body)',
  fontSize: '14px',
  color: 'var(--color-status-error)',
  marginBottom: 'var(--space-4)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'rgba(193, 68, 14, 0.1)',
  border: '1px solid rgba(193, 68, 14, 0.3)',
  borderRadius: 'var(--radius-md)',
}

interface DemoCardProps {
  user: DemoUser
  selected: boolean
  onClick: () => void
}

function DemoCard({ user, selected, onClick }: DemoCardProps) {
  const cardStyle: CSSProperties = {
    background: selected ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
    border: selected
      ? '1px solid var(--color-border-accent)'
      : '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--space-4)',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'border-color 0.15s ease',
  }

  const nameStyle: CSSProperties = {
    fontFamily: 'var(--type-body)',
    fontSize: '14px',
    fontWeight: 600,
    color: selected ? 'var(--color-text-accent)' : 'var(--color-text-primary)',
    display: 'block',
    marginBottom: 'var(--space-1)',
  }

  const emailStyle: CSSProperties = {
    fontFamily: 'var(--type-label)',
    fontSize: '11px',
    color: 'var(--color-text-tertiary)',
    display: 'block',
    marginBottom: 'var(--space-1)',
  }

  const roleStyle: CSSProperties = {
    fontFamily: 'var(--type-label)',
    fontSize: '11px',
    color: selected ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
  }

  return (
    <button type="button" style={cardStyle} onClick={onClick} aria-pressed={selected}>
      <span style={nameStyle}>{user.name}</span>
      <span style={emailStyle}>{user.email}</span>
      <span style={roleStyle}>{user.role}</span>
    </button>
  )
}

export function LoginPage() {
  const { isAuthenticated } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()
  const { mutate: login, isPending, error } = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } } | null)?.from ?? { pathname: '/' }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  function handleDemoSelect(user: DemoUser) {
    setSelectedDemo(user.email)
    setEmail(user.email)
    setPassword(user.password)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    login(
      { email, password },
      {
        onSuccess: () => {
          void navigate(from)
        },
      }
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={headingStyle}>Log In</h1>
        <p style={subtitleStyle}>Access your Mars Mission Fund account.</p>

        <p style={sectionLabelStyle}>Demo accounts</p>
        <div style={demoGridStyle}>
          {DEMO_USERS.map((user) => (
            <DemoCard
              key={user.email}
              user={user}
              selected={selectedDemo === user.email}
              onClick={() => handleDemoSelect(user)}
            />
          ))}
        </div>

        <div style={demoDividerStyle}>
          <div style={dividerLineStyle} />
          <span style={dividerTextStyle}>Or enter credentials</span>
          <div style={dividerLineStyle} />
        </div>

        {error && (
          <p style={errorStyle} role="alert">
            {error.message}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldGroupStyle}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              ...submitButtonStyle,
              opacity: isPending ? 0.6 : 1,
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
