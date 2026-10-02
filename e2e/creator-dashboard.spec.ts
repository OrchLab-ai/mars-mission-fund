import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
}

/** Returns an ISO date string N months from today — within the valid 1-week–1-year range. */
function getFutureDate(monthsAhead: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + monthsAhead)
  return date.toISOString().split('T')[0]
}

test.describe('Header Dashboard link', () => {
  test('Creator sees Dashboard link in header nav and can navigate to /dashboard', async ({
    page,
  }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')

    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible()

    await page.getByRole('link', { name: 'Dashboard' }).first().click()

    await expect(page).toHaveURL('/dashboard')
  })

  test('Backer does not see Dashboard link in header nav', async ({ page }) => {
    await login(page, 'backer@example.com', 'backer-demo-pass')

    await expect(page.getByRole('link', { name: 'Dashboard' })).not.toBeVisible()
  })
})

test.describe('Creator dashboard', () => {
  test('dashboard shows heading and New Proposal link', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Creator Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: /New Proposal/i }).first()).toBeVisible()
  })

  test('non-creator is redirected away from /dashboard', async ({ page }) => {
    await login(page, 'backer@example.com', 'backer-demo-pass')
    await page.goto('/dashboard')
    await expect(page).not.toHaveURL('/dashboard')
  })

  test('creator can create a proposal draft, fill all 7 steps, submit for review, and see it on the dashboard', async ({
    page,
  }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await page.goto('/dashboard')

    // Click "New Proposal" link → /proposals/new
    await page
      .getByRole('link', { name: /New Proposal/i })
      .first()
      .click()
    await expect(page).toHaveURL('/proposals/new')
    await expect(page.getByRole('heading', { name: /Step 1/i })).toBeVisible()

    // ── Step 1: Mission Objectives ─────────────────────────────────────────────
    await page.locator('#title').fill('E2E Test Proposal')
    await page.locator('#category').selectOption({ index: 1 }) // first non-empty option
    await page.locator('#summary').fill('A test proposal created by automated E2E tests.')
    await page
      .locator('#description')
      .fill('Full description of the E2E test proposal for Mars mission advancement.')
    await page
      .locator('#alignmentStatement')
      .fill(
        'This proposal advances the Mars mission by demonstrating reliable E2E test automation.'
      )

    // Save Draft on Step 1 — URL should change to /proposals/:id/edit
    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page).toHaveURL(/\/proposals\/.+\/edit/)

    // Wait for the form to reload in edit mode (proposal data fetched from server)
    await expect(page.getByRole('heading', { name: /Step 1/i })).toBeVisible()

    // Step 1 data is pre-loaded; advance to Step 2
    await page.getByRole('button', { name: 'Next' }).click()

    // ── Step 2: Team Members ───────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: /Step 2/i })).toBeVisible()
    await page.locator('#member-name-0').fill('Alice Engineer')
    await page.locator('#member-role-0').fill('Lead Engineer')
    await page.getByRole('button', { name: 'Next' }).click()

    // ── Step 3: Funding Goals ──────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: /Step 3/i })).toBeVisible()
    await page.locator('#minFunding').fill('5000000')
    await page.locator('#maxFunding').fill('10000000')
    await page.locator('#deadline').fill(getFutureDate(2))
    await page.getByRole('button', { name: 'Next' }).click()

    // ── Step 4: Milestones ─────────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: /Step 4/i })).toBeVisible()
    await page.locator('#ms-title-0').fill('Design Phase')
    await page.locator('#ms-pct-0').fill('60')
    await page.locator('#ms-title-1').fill('Build Phase')
    await page.locator('#ms-pct-1').fill('40')
    await page.getByRole('button', { name: 'Next' }).click()

    // ── Step 5: Risk Disclosures ───────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: /Step 5/i })).toBeVisible()
    await page
      .getByLabel('Risk disclosure 1')
      .fill('Technical risk: propulsion system complexity may delay the timeline.')
    await page.getByRole('button', { name: 'Next' }).click()

    // ── Step 6: Media (optional — skip) ───────────────────────────────────────
    await expect(page.getByRole('heading', { name: /Step 6/i })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()

    // ── Step 7: Review & Submit ────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: /Review/i })).toBeVisible()

    // Save Draft to persist all filled data (steps 2–6) to the server
    await page.getByRole('button', { name: /save draft/i }).click()
    // Wait for the save mutation to complete (button re-enables)
    await expect(page.getByRole('button', { name: /save draft/i })).not.toBeDisabled()

    // Open the submit confirmation dialog
    await page.getByRole('button', { name: /submit.*review/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Confirm submission
    await page.getByRole('button', { name: 'Confirm Submission' }).click()

    // Should navigate back to the dashboard
    await expect(page).toHaveURL('/dashboard')

    // Proposal should appear on the dashboard (Submitted → "In Review / Approved" section)
    await expect(page.getByText('E2E Test Proposal').first()).toBeVisible()
  })
})
