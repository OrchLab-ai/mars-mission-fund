import { Pool } from 'pg'
import { AccountRow } from '../auth/types.js'
import { UpdateProfileRequest } from '@mmf/shared'

export async function listAccounts(pool: Pool): Promise<AccountRow[]> {
  const sql = `
    SELECT
      id,
      email,
      password_hash AS "passwordHash",
      display_name AS "displayName",
      bio,
      role,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM accounts
    ORDER BY created_at ASC
  `
  const result = await pool.query<AccountRow>(sql)
  return result.rows
}

export async function getAccountById(pool: Pool, id: string): Promise<AccountRow | null> {
  const sql = `
    SELECT
      id,
      email,
      password_hash AS "passwordHash",
      display_name AS "displayName",
      bio,
      role,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM accounts
    WHERE id = $1
  `
  const result = await pool.query<AccountRow>(sql, [id])
  if (result.rowCount === 0) {
    return null
  }
  return result.rows[0] ?? null
}

export async function updateAccount(
  pool: Pool,
  id: string,
  data: UpdateProfileRequest
): Promise<AccountRow | null> {
  const fields: string[] = []
  const values: (string | undefined)[] = []
  let paramIndex = 1

  if (data.displayName !== undefined) {
    fields.push(`display_name = $${paramIndex}`)
    values.push(data.displayName)
    paramIndex++
  }

  if (data.bio !== undefined) {
    fields.push(`bio = $${paramIndex}`)
    values.push(data.bio)
    paramIndex++
  }

  if (fields.length === 0) {
    return getAccountById(pool, id)
  }

  fields.push(`updated_at = now()`)
  values.push(id)

  const sql = `
    UPDATE accounts
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING
      id,
      email,
      password_hash AS "passwordHash",
      display_name AS "displayName",
      bio,
      role,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `
  const result = await pool.query<AccountRow>(sql, values)
  if (result.rowCount === 0) {
    return null
  }
  return result.rows[0] ?? null
}
