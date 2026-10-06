import { useUsers } from '../hooks/useUsers'
import { Badge } from '../components/ui/Badge'
import type { User } from '@mmf/shared'

type BadgeVariant = 'funded' | 'active' | 'new' | 'accent'

function roleBadgeVariant(role: string): BadgeVariant {
  if (role === 'Administrator' || role === 'SuperAdministrator') return 'accent'
  return 'new'
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
}

const contentStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: 'var(--space-8) var(--space-6)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-2-size)',
  fontWeight: 'var(--type-heading-2-weight)' as React.CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-heading-2-spacing)',
  lineHeight: 'var(--type-heading-2-leading)',
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-6)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-primary)',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '2px solid var(--color-border-subtle)',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--type-body-small-size)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-border-subtle)',
  verticalAlign: 'middle',
}

const rolesStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
}

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
}

const errorStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-status-error)',
}

function UserRow({ user }: { user: User }) {
  return (
    <tr>
      <td style={tdStyle}>{user.email}</td>
      <td style={tdStyle}>{user.displayName ?? '—'}</td>
      <td style={tdStyle}>
        <div style={rolesStyle}>
          <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
        </div>
      </td>
    </tr>
  )
}

export function AdminUsersPage() {
  const { data: users, isLoading, isError } = useUsers()

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>Loading users…</div>
      </div>
    )
  }

  if (isError || !users) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>Failed to load users. Please try again.</div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <h1 style={headingStyle}>Users</h1>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Display Name</th>
              <th style={thStyle}>Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
