import { useRef, useEffect } from 'react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markNotificationRead } from '../api/notifications'
import type { Notification } from '../api/notifications'
import { useAuthContext } from '../context/AuthContext'

const bellButtonStyle: React.CSSProperties = {
  position: 'relative',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-2px',
  right: '-4px',
  background: 'var(--color-status-error, #e53e3e)',
  color: '#fff',
  borderRadius: '9999px',
  fontSize: '10px',
  fontWeight: 700,
  lineHeight: 1,
  minWidth: '16px',
  height: '16px',
  padding: '0 4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-card)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  width: '340px',
  maxHeight: '480px',
  overflowY: 'auto',
  zIndex: 200,
}

const dropdownHeaderStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-border-subtle)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const itemStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-border-subtle)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
}

const itemUnreadStyle: React.CSSProperties = {
  ...itemStyle,
  background: 'rgba(26, 58, 110, 0.04)',
  borderLeft: '3px solid var(--color-accent-primary)',
}

const itemTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 2px',
}

const itemMessageStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
  margin: 0,
}

const markReadBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: '2px 8px',
  fontFamily: 'var(--font-body)',
  fontSize: '11px',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const dropdownFooterStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  textAlign: 'center',
}

const viewAllLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-accent-primary)',
  textDecoration: 'none',
}

const emptyStyle: React.CSSProperties = {
  padding: 'var(--space-6) var(--space-4)',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--type-body-small-size)',
  color: 'var(--color-text-secondary)',
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function NotificationItem({ notification }: { notification: Notification }) {
  const queryClient = useQueryClient()
  const { mutate: markRead, isPending } = useMutation({
    mutationFn: () => markNotificationRead(notification.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return (
    <div style={notification.read ? itemStyle : itemUnreadStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={itemTitleStyle}>{notification.title}</p>
        <p style={itemMessageStyle}>{notification.message}</p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            margin: '2px 0 0',
          }}
        >
          {dateFormatter.format(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <button
          style={markReadBtnStyle}
          disabled={isPending}
          onClick={() => markRead()}
          aria-label={`Mark as read: ${notification.title}`}
        >
          {isPending ? '…' : 'Mark as read'}
        </button>
      )}
    </div>
  )
}

export function NotificationBell() {
  const { isAuthenticated } = useAuthContext()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30000,
    enabled: isAuthenticated,
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!isAuthenticated) return null

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0
  const topTen = notifications
    ? [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10)
    : []

  return (
    <div ref={containerRef} style={containerStyle}>
      <button
        style={bellButtonStyle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Bell SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={badgeStyle} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={dropdownStyle} role="dialog" aria-label="Notifications">
          <div style={dropdownHeaderStyle}>Notifications</div>
          {topTen.length === 0 ? (
            <div style={emptyStyle}>No notifications yet.</div>
          ) : (
            topTen.map((n) => <NotificationItem key={n.id} notification={n} />)
          )}
          <div style={dropdownFooterStyle}>
            <Link to="/notifications" style={viewAllLinkStyle} onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
