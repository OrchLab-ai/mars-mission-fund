import { createRequire } from 'node:module'
import path from 'node:path'
import pino from 'pino'

// better-sqlite3 is CommonJS with a native binding; createRequire keeps it working
// from an ESM build without a default-interop shim.
const require = createRequire(import.meta.url)
const Database = require('better-sqlite3') as typeof import('better-sqlite3')

const logger = pino({ name: 'pool' })

/**
 * The result shape `pg` returned. The application reads `rows` and occasionally
 * `rowCount`, and nothing else, so that is all this reproduces.
 */
// `any` matches what @types/pg does, and for the same reason: callers index into
// rows with property names the compiler cannot know. Narrowing this default would
// mean adding type assertions at 58 call sites, which ADR-0004 exists to avoid.
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export interface QueryResult<R = any> {
  rows: R[]
  rowCount: number
}

/**
 * The database handle the application is given.
 *
 * Named `Pool` deliberately: every query function in this server takes a
 * `pool: Pool` first argument, and keeping the name means those signatures — and
 * the exercise instructions that describe them — do not change. There is no
 * connection pool behind it; SQLite is a file and a single handle.
 *
 * See ADR-0004 for why the application keeps PostgreSQL-shaped SQL.
 */
export interface Pool {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  query<R = any>(sql: string, params?: unknown[]): Promise<QueryResult<R>>
  /**
   * Checks out a handle for a transaction. `verifyMilestone` is the one caller: it
   * issues BEGIN, several statements, then COMMIT or ROLLBACK.
   */
  connect(): Promise<PoolClient>
  /** Closes the handle. Kept async because the shutdown path in `index.ts` awaits it. */
  end(): Promise<void>
}

/**
 * What `pool.connect()` hands back.
 *
 * SQLite is one connection to one file, so this is the same handle with a
 * `release()` that has nothing to release. That is sound here because the one
 * transaction in this codebase is fully sequential — it never interleaves work on
 * another connection — and SQLite serialises writes anyway.
 */
export interface PoolClient {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  query<R = any>(sql: string, params?: unknown[]): Promise<QueryResult<R>>
  release(): void
}

// --------------------------------------------------------------------- dialect

/**
 * Rewrite `$n` placeholders and `= ANY($n)` clauses to SQLite's positional `?`,
 * collecting the parameters in the order the statement will consume them.
 *
 * Both are handled in ONE pass, and that is load-bearing rather than tidiness.
 * `?` carries no index, so the parameter array has to be built in statement order;
 * expanding an array clause in a separate pass emits placeholders the other pass
 * cannot see, and SQLite then rejects the statement for too few parameters.
 *
 * A consequence of the single pass: a parameter referenced twice is bound twice,
 * which is what positional placeholders require.
 */
function bindParameters(sql: string, params: unknown[]): { sql: string; params: unknown[] } {
  const ordered: unknown[] = []

  const rewritten = sql.replace(
    /=\s*ANY\s*\(\s*\$(\d+)\s*\)|\$(\d+)/gi,
    (_match, anyIndex: string | undefined, plainIndex: string | undefined) => {
      if (anyIndex !== undefined) {
        // Postgres passes an array as a single parameter here. SQLite has no array
        // type and needs one placeholder per element.
        const value = params[Number(anyIndex) - 1]
        const items = Array.isArray(value) ? value : [value]
        if (items.length === 0) {
          // `IN ()` is a syntax error, and an empty Postgres ANY matches nothing.
          return 'IN (SELECT NULL WHERE 0)'
        }
        ordered.push(...items)
        return `IN (${items.map(() => '?').join(', ')})`
      }

      ordered.push(params[Number(plainIndex) - 1])
      return '?'
    }
  )

  return { sql: rewritten, params: ordered }
}

/** ISO-8601 with milliseconds and a Z, matching what `pg` produced via JS Dates. */
const SQLITE_NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"

function translate(sql: string, params: unknown[]): { sql: string; params: unknown[] } {
  const positional = bindParameters(sql, params)
  const translated = positional.sql
    // SQLite's LIKE is already case-insensitive for ASCII, which is what the one
    // ILIKE in this codebase relies on.
    .replace(/\bILIKE\b/gi, 'LIKE')
    .replace(/\bnow\(\)/gi, SQLITE_NOW)
  return { sql: translated, params: positional.params }
}

// ---------------------------------------------------------------------- values

/** Columns SQLite stores as JSON text but the application expects as an array. */
const JSON_ARRAY_COLUMNS = new Set(['tags'])

/**
 * Does this column hold a timestamp?
 *
 * `pg` hydrated TIMESTAMPTZ into a JS `Date`, and the row types depend on it —
 * `CampaignRow` declares `createdAt: Date` and `deadline: Date | null`. SQLite
 * returns TEXT, so the conversion has to happen here, driven by naming.
 */
function isTimestampColumn(column: string): boolean {
  return column.endsWith('_at') || column === 'deadline'
}

/** Coerce a JS value into something better-sqlite3 will bind. */
function toBindable(value: unknown): unknown {
  if (value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value !== null && typeof value === 'object') return JSON.stringify(value)
  return value
}

/** Reverse the storage representation for one column. */
function fromStored(column: string, value: unknown): unknown {
  if (value === null || value === undefined) return value

  if (JSON_ARRAY_COLUMNS.has(column)) {
    if (Array.isArray(value)) return value
    try {
      const parsed: unknown = JSON.parse(String(value))
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // A legacy Postgres array literal ('{a,b}') should not crash a read.
      logger.warn({ column }, 'could not parse JSON array column; returning empty')
      return []
    }
  }

  if (isTimestampColumn(column) && typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed
  }

  return value
}

function hydrate<R>(rows: Record<string, unknown>[]): R[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const [column, value] of Object.entries(row)) {
      out[column] = fromStored(column, value)
    }
    return out as R
  })
}

// ------------------------------------------------------------------ connection

/**
 * dbmate addresses SQLite as `sqlite:<path>`, and the same URL is handed to the
 * server so that both agree on which file they are using.
 */
function resolveDatabaseFile(url: string | undefined): string {
  const fallback = path.join('packages', 'server', 'db', 'mmf.sqlite3')
  if (!url) return fallback
  const withoutScheme = url.replace(/^sqlite3?:(\/\/)?/, '')
  return withoutScheme.length > 0 ? withoutScheme : fallback
}

const databaseFile = resolveDatabaseFile(process.env['DATABASE_URL'])
const db = new Database(databaseFile)

// Foreign keys are off by default in SQLite and have to be enabled per connection.
// Thirteen migrations declare REFERENCES, so without this they are decoration.
db.pragma('foreign_keys = ON')
// WAL lets readers run while a write is in progress, which is what makes a single
// file acceptable for the dev server and its tests.
db.pragma('journal_mode = WAL')

logger.info({ databaseFile }, 'sqlite database opened')

/** Statements that return rows, as opposed to reporting a change count. */
function returnsRows(sql: string): boolean {
  return /^\s*(?:select|pragma|with)\b/i.test(sql) || /\breturning\b/i.test(sql)
}

/**
 * BEGIN / COMMIT / ROLLBACK have to bypass `prepare`.
 *
 * better-sqlite3 refuses to prepare a transaction-control statement — it wants you
 * to use its own `db.transaction()` wrapper — but the application issues them as
 * plain SQL through the client. `db.exec` runs them without complaint, which lets
 * the existing BEGIN/COMMIT/ROLLBACK code stand unchanged.
 */
function isTransactionControl(sql: string): boolean {
  return /^\s*(?:begin|commit|rollback|end|savepoint|release)\b/i.test(sql)
}

export const pool: Pool = {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  query<R = any>(sql: string, params: unknown[] = []): Promise<QueryResult<R>> {
    const translated = translate(sql, params)
    const bound = translated.params.map(toBindable)

    try {
      if (isTransactionControl(translated.sql)) {
        db.exec(translated.sql)
        return Promise.resolve({ rows: [], rowCount: 0 })
      }
      const statement = db.prepare(translated.sql)
      if (returnsRows(translated.sql)) {
        const rows = statement.all(...bound) as Record<string, unknown>[]
        return Promise.resolve({ rows: hydrate<R>(rows), rowCount: rows.length })
      }
      const info = statement.run(...bound)
      return Promise.resolve({ rows: [], rowCount: info.changes })
    } catch (err) {
      // The original SQL is more useful here than the translated form, since that is
      // what is written in the source file the reader will open.
      logger.error({ err, sql }, 'query failed')
      return Promise.reject(err)
    }
  },

  connect(): Promise<PoolClient> {
    return Promise.resolve({
      query: (sql: string, params?: unknown[]) => pool.query(sql, params),
      release: () => {
        /* one file, one handle - nothing to hand back */
      },
    })
  },

  end(): Promise<void> {
    // WAL leaves a -wal and a -shm file beside the database until the last handle
    // closes, so an orderly close on shutdown is what keeps the directory tidy.
    db.close()
    logger.info('sqlite database closed')
    return Promise.resolve()
  },
}

export default pool
