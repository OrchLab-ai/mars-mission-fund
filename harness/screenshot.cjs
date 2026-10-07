// Screenshot one URL with the Playwright installed in a run's worktree.
// Usage: node harness/screenshot.cjs <worktree> <url> <out.png>
// Lives here, not in the worktree, so the agent cannot change it.
const { createRequire } = require('node:module')
const path = require('node:path')

const [worktree, url, out] = process.argv.slice(2)
if (!worktree || !url || !out) {
  console.error('usage: screenshot.cjs <worktree> <url> <out.png>')
  process.exit(2)
}

// Resolve from the worktree's node_modules, not from wherever this file sits.
const { chromium } = createRequire(path.join(path.resolve(worktree), 'noop.js'))('@playwright/test')

;(async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    // Not networkidle alone: a dev server can keep the network busy, and then it never comes.
    // Wait for the page to load and show its title, then give the rest of its data up to 10 seconds.
    await page.goto(url, { waitUntil: 'load', timeout: 30000 })
    // The page says "Loading proposal..." until its data arrives; the title means it has.
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30000 })
    // Each section fetches its own data and says "Loading..." until it has it.
    await page
      .waitForFunction(() => !/Loading/.test(document.body.innerText), null, { timeout: 15000 })
      .catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.screenshot({ path: out, fullPage: true })
  } finally {
    await browser.close()
  }
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
