import { NotificationSchema } from '@mmf/shared'
import type { Notification } from '@mmf/shared'
import { authedFetch } from './client'

export type { Notification }

export async function fetchNotifications(): Promise<Notification[]> {
  const response = await authedFetch('/v1/notifications')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return (json.data as unknown[]).map((item) => NotificationSchema.parse(item))
}

export async function markNotificationRead(id: string): Promise<void> {
  const response = await authedFetch(`/v1/notifications/${id}/read`, { method: 'PATCH' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}
