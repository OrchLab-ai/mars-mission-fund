import { Pool } from 'pg'
import { AccountRow } from './types.js'

export async function findAccountByEmail(pool: Pool, email: string): Promise<AccountRow | null> {
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
    WHERE email = $1
  `
  const result = await pool.query<AccountRow>(sql, [email])
  if (result.rowCount === 0) {
    return null
  }
  return result.rows[0] ?? null
}

export async function findAccountById(pool: Pool, id: string): Promise<AccountRow | null> {
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
