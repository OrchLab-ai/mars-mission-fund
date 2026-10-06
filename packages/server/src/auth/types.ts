import { RoleSchema, UserSchema, LoginRequestSchema, LoginResponseSchema } from '@mmf/shared'
import { z } from 'zod'

export { RoleSchema, UserSchema, LoginRequestSchema, LoginResponseSchema }
export type { Role, User, LoginRequest, LoginResponse } from '@mmf/shared'

// Internal type that includes password_hash — never exposed in API responses
export const AccountRowSchema = UserSchema.extend({
  passwordHash: z.string(),
})

export type AccountRow = z.infer<typeof AccountRowSchema>
