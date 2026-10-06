// DEMO STUB (L4-001 §5.2): this middleware performs stateless JWT verification only.
// There is no server-side session store or token revocation list in this demo stub.
// Production systems should implement token revocation (e.g. via a blocklist in Redis).

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED' } })
    return
  }

  const secret = process.env['JWT_SECRET']
  if (!secret) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR' } })
    return
  }

  try {
    const payload = jwt.verify(token, secret)
    res.locals['user'] = payload
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED' } })
  }
}
