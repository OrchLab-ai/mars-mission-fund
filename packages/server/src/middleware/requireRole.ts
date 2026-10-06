import type { Request, Response, NextFunction } from 'express'
import type { Role } from '@mmf/shared'

export function requireRole(role: Role | Role[]) {
  const roles = Array.isArray(role) ? role : [role]
  return function (req: Request, res: Response, next: NextFunction): void {
    const user = res.locals['user'] as { role?: string } | undefined
    if (!user?.role || !roles.includes(user.role as Role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN' } })
      return
    }
    next()
  }
}
