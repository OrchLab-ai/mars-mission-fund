import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = __dirname
const SOURCE_FILE = /\.(css|tsx?|jsx?)$/
const TEST_FILE = /\.test\.[tj]sx?$/

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(path)
    return SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name) ? [path] : []
  })
}

describe('design tokens', () => {
  const files = listFiles(SRC).map((path) => ({
    path,
    text: readFileSync(path, 'utf8'),
  }))

  const defined = new Set<string>()
  for (const { text } of files) {
    for (const match of text.matchAll(/(--[\w-]+)\s*:/g)) defined.add(match[1])
  }

  it('defines every custom property referenced with var() in packages/client/src', () => {
    const undefinedUses = new Map<string, Set<string>>()
    for (const { path, text } of files) {
      for (const match of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (defined.has(match[1])) continue
        const where = undefinedUses.get(match[1]) ?? new Set<string>()
        where.add(path.slice(SRC.length + 1))
        undefinedUses.set(match[1], where)
      }
    }

    const report = [...undefinedUses].map(([name, where]) => `${name} (${[...where].join(', ')})`)
    expect(report).toEqual([])
  })
})
