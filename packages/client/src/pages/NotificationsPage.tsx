import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markNotificationRead } from '../api/notifications'
import type { Notification } from '../api/notifications'

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg-page)',
}

const contentStyle: CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: 'var(--space-8) var(--space-6)',
}

const headingStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--type-heading-2-size)',
  fontWeight: 'var(--type-heading-2-weight)' as CSSProperties['fontWeight'],
  letterSpacing: 'var(--type-heading-2-spacing)',
  lineHeight: 'var(--type-heading-2-leading)',
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-6)',
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

const errorStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-status-error)',
}

const emptyStyle: CSSProperties = {
  padding: 'var(--space-12) 0',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
}

const notificationRowStyle: CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-4) var(--space-5)',
  marginBottom: 'var(--space-3)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 'var(--space-4)',
}

const notificationRowUnreadStyle: CSSProperties = {
  ...notificationRowStyle,
  borderLeft: '3px solid var(--color-accent-primary)',
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 var(--space-1)',
}

const messageStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-size)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--space-2)',
}

const metaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-tertiary)',
  margin: 0,
}

const markReadButtonStyle: CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-1) var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const campaignLinkStyle: CSSProperties = {
  color: 'var(--color-accent-primary)',
  textDecoration: 'none',
  fontSize: 'var(--type-body-small-size)',
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function NotificationRow({ notification }: { notification: Notification }) {
  const queryClient = useQueryClient()

  const { mutate: markRead, isPending } = useMutation({
    mutationFn: () => markNotificationRead(notification.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return (
    <div style={notification.read ? notificationRowStyle : notificationRowUnreadStyle}>
      <div style={{ flex: 1 }}>
        <p style={titleStyle}>{notification.title}</p>
        <p style={messageStyle}>{notification.message}</p>
        <p style={metaStyle}>
          {dateFormatter.format(notification.createdAt)}
          {notification.campaignId && (
            <>
              {' · '}
              <Link to={`/campaigns/${notification.campaignId}`} style={campaignLinkStyle}>
                View campaign
              </Link>
            </>
          )}
        </p>
      </div>
      {!notification.read && (
        <button
          style={markReadButtonStyle}
          disabled={isPending}
          onClick={() => markRead()}
          aria-label={`Mark notification as read: ${notification.title}`}
        >
          {isPending ? 'Marking…' : 'Mark as read'}
        </button>
      )}
    </div>
  )
}

export function NotificationsPage() {
  const {
    data: notifications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  })

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle} role="status" aria-busy="true">
          Loading notifications…
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle} role="alert">
          Failed to load notifications. Please try again.
        </div>
      </div>
    )
  }

  const sorted = notifications
    ? [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : []

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <h1 style={headingStyle}>Notifications</h1>

        {sorted.length === 0 && <div style={emptyStyle}>No notifications yet.</div>}

        {sorted.map((notification) => (
          <NotificationRow key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  )
}
