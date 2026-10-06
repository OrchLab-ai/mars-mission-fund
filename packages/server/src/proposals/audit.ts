import { Pool } from 'pg'
import pino from 'pino'

const logger = pino({ name: 'audit' })

export interface AuditEventInput {
  action: string
  correlationId?: string
  service?: string
  message?: string
  eventType?: string
  actorId?: string
  actorType?: string
  resourceType?: string
  resourceId?: string
  outcome?: string
  previousState?: Record<string, unknown>
  newState?: Record<string, unknown>
  rationale?: string
}

export async function writeAuditEvent(pool: Pool, event: AuditEventInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_events (
        correlation_id, service, message, event_type,
        actor_id, actor_type, action, resource_type, resource_id,
        outcome, previous_state, new_state, rationale
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        event.correlationId ?? null,
        event.service ?? null,
        event.message ?? null,
        event.eventType ?? null,
        event.actorId ?? null,
        event.actorType ?? null,
        event.action,
        event.resourceType ?? null,
        event.resourceId ?? null,
        event.outcome ?? null,
        event.previousState ? JSON.stringify(event.previousState) : null,
        event.newState ? JSON.stringify(event.newState) : null,
        event.rationale ?? null,
      ]
    )
  } catch (err) {
    logger.error({ err }, 'Failed to write audit event')
  }
}
