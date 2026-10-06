import { z } from 'zod'
import { UpdateProfileRequestSchema } from '@mmf/shared'

export { UpdateProfileRequestSchema }
export type { UpdateProfileRequest, User } from '@mmf/shared'

export const UserParamsSchema = z.object({
  id: z.string().uuid(),
})

export type UserParams = z.infer<typeof UserParamsSchema>
