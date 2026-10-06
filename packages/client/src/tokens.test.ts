import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = import.meta.dirname
const SOURCE_FILE = /\.(css|ts|tsx)$/
const TEST_FILE = /\.test\.(ts|tsx)$/

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(path)
    return SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name) ? [path] : []
  })
}

const files = listFiles(SRC)
const defined = new Set<string>()
const used = new Map<string, Set<string>>()

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const [, name] of text.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)) {
    defined.add(name)
  }
  for (const [, name] of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
    if (!used.has(name)) used.set(name, new Set())
    used.get(name)!.add(file.slice(SRC.length + 1))
  }
}

describe('design tokens', () => {
  it('finds source files and token usages', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(used.size).toBeGreaterThan(0)
  })

  it('defines every custom property referenced with var(--name) in src', () => {
    const undefinedTokens = [...used.entries()]
      .filter(([name]) => !defined.has(name))
      .map(([name, where]) => `${name} (used in ${[...where].sort().join(', ')})`)
      .sort()

    expect(undefinedTokens).toEqual([])
  })
})
