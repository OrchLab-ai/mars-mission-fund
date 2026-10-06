import { UserSchema } from '@mmf/shared'
import type { User } from '@mmf/shared'
import { authedFetch } from './client'

export type { User }

export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const response = await fetch('/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    const json = await response.json().catch(() => ({}))
    const msg =
      (json as { error?: { code?: string } }).error?.code ??
      (json as { message?: string }).message ??
      `HTTP ${response.status}`
    throw new Error(msg)
  }
  const json = await response.json()
  const envelope = json as { data: { token: string; user: unknown } }
  return {
    token: envelope.data.token,
    user: UserSchema.parse(envelope.data.user),
  }
}

export async function logoutUser(): Promise<void> {
  const response = await authedFetch('/v1/auth/logout', { method: 'POST' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await authedFetch('/v1/auth/me')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return UserSchema.parse((json as { data: unknown }).data ?? json)
}

export async function updateProfile(data: {
  displayName?: string | null
  bio?: string | null
}): Promise<User> {
  const response = await authedFetch('/v1/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return UserSchema.parse((json as { data: unknown }).data ?? json)
}

export async function fetchUsers(): Promise<User[]> {
  const response = await authedFetch('/v1/users')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  return ((json as { data: unknown[] }).data as unknown[]).map((item) => UserSchema.parse(item))
}
