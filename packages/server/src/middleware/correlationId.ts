import type { Request, Response, NextFunction } from 'express'

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-correlation-id'] as string | undefined) ?? crypto.randomUUID()
  res.locals['correlationId'] = id
  res.setHeader('x-correlation-id', id)
  next()
}
