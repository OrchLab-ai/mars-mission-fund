import { type CSSProperties, type FormEvent, useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import { useUpdateProfile } from '../hooks/useAuth'
import { Badge } from '../components/ui/Badge'

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
  padding: 'var(--space-10) var(--space-6)',
}

const containerStyle: CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--type-section-heading)',
  fontSize: '32px',
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 'var(--space-8)',
}

const cardStyle: CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-8)',
  marginBottom: 'var(--space-6)',
}

const sectionLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '11px',
  color: 'var(--color-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 'var(--space-2)',
}

const fieldValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-5)',
}

const rolesRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-5)',
}

const dividerStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border-subtle)',
  marginTop: 'var(--space-4)',
  marginBottom: 'var(--space-6)',
}

const editHeadingStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-5)',
}

const fieldGroupStyle: CSSProperties = {
  marginBottom: 'var(--space-4)',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
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
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '100px',
}

const submitButtonStyle: CSSProperties = {
  padding: 'var(--space-3) var(--space-6)',
  background: 'var(--color-text-accent)',
  color: 'var(--color-text-on-action)',
  border: 'none',
  borderRadius: 'var(--radius-button)',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 'var(--space-4)',
}

const successStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-status-success)',
  marginTop: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--color-status-success-bg)',
  border: '1px solid var(--color-status-success-border)',
  borderRadius: 'var(--radius-md)',
}

const errorStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-status-error)',
  marginTop: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'rgba(193, 68, 14, 0.1)',
  border: '1px solid rgba(193, 68, 14, 0.3)',
  borderRadius: 'var(--radius-md)',
}

const loadingStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
}

export function ProfilePage() {
  const { user, isAuthenticated } = useAuthContext()
  const { mutate: updateProfile, isPending, error, isSuccess, reset } = useUpdateProfile()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')

  if (!isAuthenticated || !user) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>Loading profile…</div>
      </div>
    )
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    reset()
    updateProfile({ displayName: displayName || null, bio: bio || null })
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={headingStyle}>Profile</h1>

        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Email</p>
          <p style={fieldValueStyle}>{user.email}</p>

          <p style={sectionLabelStyle}>Role</p>
          <div style={rolesRowStyle}>
            <Badge variant="active">{user.role}</Badge>
          </div>

          <div style={dividerStyle} />

          <p style={editHeadingStyle}>Edit Profile</p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={fieldGroupStyle}>
              <label htmlFor="displayName" style={labelStyle}>
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={inputStyle}
                placeholder="Your display name"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="bio" style={labelStyle}>
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={textareaStyle}
                placeholder="Tell us about yourself"
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
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>

            {isSuccess && (
              <p style={successStyle} role="status">
                Profile updated successfully.
              </p>
            )}

            {error && (
              <p style={errorStyle} role="alert">
                {error.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
