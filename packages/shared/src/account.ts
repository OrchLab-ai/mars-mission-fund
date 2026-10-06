import { z } from 'zod'

export const RoleSchema = z.enum([
  'Backer',
  'Creator',
  'Reviewer',
  'Administrator',
  'SuperAdministrator',
])

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  bio: z.string().nullable(),
  role: RoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
})

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
})

export type Role = z.infer<typeof RoleSchema>
export type User = z.infer<typeof UserSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>
