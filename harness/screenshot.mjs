// Screenshot one page with the Playwright installed in the current directory (the worktree).
// Usage: node screenshot.mjs <url> <out.png>   (run from the worktree root)
import { createRequire } from 'node:module'
import path from 'node:path'

const [url, out] = process.argv.slice(2)
const { chromium } = createRequire(path.join(process.cwd(), 'noop.js'))('playwright')

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.screenshot({ path: out, fullPage: true })
} finally {
  await browser.close()
}
