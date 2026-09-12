import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Pool } from './pool.js'

// The adapter translates PostgreSQL-shaped SQL for SQLite (ADR-0004). Everything
// worth testing about it is a translation, so each test runs a real statement
// through a real SQLite file rather than asserting on rewritten strings.

let pool: Pool
let directory: string

beforeAll(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mmf-pool-'))
  // The adapter opens its file at import time, so the URL has to be set first.
  process.env['DATABASE_URL'] = `sqlite:${path.join(directory, 'adapter.sqlite3')}`
  ;({ pool } = await import('./pool.js'))

  await pool.query(`
    CREATE TABLE campaigns (
      id                TEXT PRIMARY KEY,
      title             TEXT NOT NULL,
      category          TEXT NOT NULL,
      tags              TEXT NOT NULL DEFAULT '[]',
      contributor_count INTEGER NOT NULL DEFAULT 0,
      deadline          TEXT,
      created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `)
})

afterAll(() => {
  // An open WAL database cannot always be deleted on Windows; a leftover temp file
  // is not worth failing a suite over.
  try {
    fs.rmSync(directory, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

describe('placeholders', () => {
  it('binds $n parameters in the order the statement uses them', async () => {
    await pool.query('INSERT INTO campaigns (id, title, category) VALUES ($1, $2, $3)', [
      'c1',
      'Ares Lander',
      'Transport',
    ])

    const result = await pool.query<{ title: string; category: string }>(
      'SELECT title, category FROM campaigns WHERE id = $1',
      ['c1']
    )
    expect(result.rows[0]).toEqual({ title: 'Ares Lander', category: 'Transport' })
  })

  it('binds a parameter referenced twice, which positional ? cannot do alone', async () => {
    const result = await pool.query<{ title: string }>(
      'SELECT title FROM campaigns WHERE title = $1 OR category = $1',
      ['Transport']
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]?.title).toBe('Ares Lander')
  })
})

describe('value round-trips', () => {
  it('stores a string array as JSON and reads it back as an array', async () => {
    await pool.query('INSERT INTO campaigns (id, title, category, tags) VALUES ($1, $2, $3, $4)', [
      'c2',
      'Hab Module',
      'Habitat',
      ['life-support', 'pressurised'],
    ])

    const result = await pool.query<{ tags: string[] }>('SELECT tags FROM campaigns WHERE id = $1', [
      'c2',
    ])
    expect(result.rows[0]?.tags).toEqual(['life-support', 'pressurised'])
  })

  it('returns timestamp columns as Date objects, the way pg did', async () => {
    const deadline = new Date('2027-01-02T03:04:05.678Z')
    await pool.query(
      'INSERT INTO campaigns (id, title, category, deadline) VALUES ($1, $2, $3, $4)',
      ['c3', 'Surface Rover', 'Transport', deadline]
    )

    const result = await pool.query<{ deadline: Date; created_at: Date }>(
      'SELECT deadline, created_at FROM campaigns WHERE id = $1',
      ['c3']
    )
    expect(result.rows[0]?.deadline).toBeInstanceOf(Date)
    expect(result.rows[0]?.deadline.toISOString()).toBe(deadline.toISOString())
    // created_at came from the column default, not from a bound parameter.
    expect(result.rows[0]?.created_at).toBeInstanceOf(Date)
  })

  it('leaves a null timestamp null rather than turning it into an epoch Date', async () => {
    const result = await pool.query<{ deadline: Date | null }>(
      'SELECT deadline FROM campaigns WHERE id = $1',
      ['c1']
    )
    expect(result.rows[0]?.deadline).toBeNull()
  })
})

describe('dialect translation', () => {
  it('expands = ANY($n) into an IN list', async () => {
    const result = await pool.query<{ id: string }>(
      'SELECT id FROM campaigns WHERE category = ANY($1) ORDER BY id',
      [['Transport', 'Habitat']]
    )
    expect(result.rows.map((row) => row.id)).toEqual(['c1', 'c2', 'c3'])
  })

  it('matches nothing for an empty ANY, as Postgres does', async () => {
    const result = await pool.query('SELECT id FROM campaigns WHERE category = ANY($1)', [[]])
    expect(result.rows).toHaveLength(0)
  })

  it('treats ILIKE as case-insensitive', async () => {
    const result = await pool.query<{ id: string }>(
      'SELECT id FROM campaigns WHERE title ILIKE $1',
      ['%rover%']
    )
    expect(result.rows.map((row) => row.id)).toEqual(['c3'])
  })

  it('translates now() into a timestamp SQLite understands', async () => {
    await pool.query('UPDATE campaigns SET created_at = now() WHERE id = $1', ['c1'])
    const result = await pool.query<{ created_at: Date }>(
      'SELECT created_at FROM campaigns WHERE id = $1',
      ['c1']
    )
    expect(result.rows[0]?.created_at).toBeInstanceOf(Date)
    expect(Number.isNaN(result.rows[0]?.created_at.getTime())).toBe(false)
  })
})

describe('result shape', () => {
  it('reports rowCount for a statement that changes rows', async () => {
    const result = await pool.query('UPDATE campaigns SET contributor_count = $1 WHERE id = $2', [
      7,
      'c1',
    ])
    expect(result.rowCount).toBe(1)
    expect(result.rows).toEqual([])
  })

  it('returns rows for RETURNING, which 13 call sites depend on', async () => {
    const result = await pool.query<{ id: string; contributor_count: number }>(
      'UPDATE campaigns SET contributor_count = $1 WHERE id = $2 RETURNING id, contributor_count',
      [42, 'c2']
    )
    expect(result.rows).toEqual([{ id: 'c2', contributor_count: 42 }])
  })

  it('rejects with the underlying error when a statement is invalid', async () => {
    await expect(pool.query('SELECT * FROM no_such_table')).rejects.toThrow(/no_such_table/)
  })
})

describe('transactions', () => {
  // better-sqlite3 refuses to prepare BEGIN/COMMIT/ROLLBACK, so the adapter routes
  // them to db.exec. verifyMilestone issues them as plain SQL through a client.
  it('commits work done through a checked-out client', async () => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('INSERT INTO campaigns (id, title, category) VALUES ($1, $2, $3)', [
        'tx-commit',
        'Fuel Depot',
        'Logistics',
      ])
      await client.query('COMMIT')
    } finally {
      client.release()
    }

    const result = await pool.query('SELECT id FROM campaigns WHERE id = $1', ['tx-commit'])
    expect(result.rows).toHaveLength(1)
  })

  it('discards work on ROLLBACK', async () => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('INSERT INTO campaigns (id, title, category) VALUES ($1, $2, $3)', [
        'tx-rollback',
        'Dust Shield',
        'Habitat',
      ])
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    const result = await pool.query('SELECT id FROM campaigns WHERE id = $1', ['tx-rollback'])
    expect(result.rows).toHaveLength(0)
  })
})
