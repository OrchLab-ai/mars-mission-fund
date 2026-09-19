import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
}

/** Returns an ISO date string N days from today. */
function getFutureDateByDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/** Returns an ISO date string N months from today. */
function getFutureDateByMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

test.describe('Proposal date picker', () => {
  test('deadline — out-of-range date shows inline error, valid date clears it', async ({
    page,
  }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')

    await page.goto('/proposals/new')
    await expect(page.getByRole('heading', { name: /Step 1/i })).toBeVisible()

    // Step 1: fill minimal required fields
    await page.locator('#title').fill('Date Picker E2E Test')
    await page.locator('#category').selectOption({ index: 1 })
    await page.locator('#summary').fill('Testing date picker inline validation.')
    await page.locator('#description').fill('Full description for date picker E2E test.')
    await page
      .locator('#alignmentStatement')
      .fill('Validates the accessible date picker component.')
    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page).toHaveURL(/\/proposals\/.+\/edit/)

    // Step 2: fill minimal team member and advance
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: /Step 2/i })).toBeVisible()
    await page.locator('#member-name-0').fill('Test Engineer')
    await page.locator('#member-role-0').fill('Engineer')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3: Funding Goals — date picker is visible
    await expect(page.getByRole('heading', { name: /Step 3/i })).toBeVisible()
    await page.locator('#minFunding').fill('5000000')

    // Enter a date more than 1 year from today → should show inline error
    const tooFarDate = getFutureDateByMonths(14)
    await page.locator('#deadline').fill(tooFarDate)
    // Trigger change by tabbing away
    await page.keyboard.press('Tab')

    const errorMsg = page.getByRole('alert')
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toContainText('Deadline must be between 7 days and 1 year from today')

    // Correct the deadline to a valid date → error message should be gone
    const validDate = getFutureDateByDays(30)
    await page.locator('#deadline').fill(validDate)
    await page.keyboard.press('Tab')

    await expect(errorMsg).not.toBeVisible()

    // Advance to Step 4
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: /Step 4/i })).toBeVisible()
  })

  test('milestone target date — valid date shows no error', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')

    await page.goto('/proposals/new')
    await expect(page.getByRole('heading', { name: /Step 1/i })).toBeVisible()

    // Step 1
    await page.locator('#title').fill('Milestone Date Picker E2E')
    await page.locator('#category').selectOption({ index: 1 })
    await page.locator('#summary').fill('Milestone date picker test.')
    await page.locator('#description').fill('Full description.')
    await page.locator('#alignmentStatement').fill('Validates milestone date picker.')
    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page).toHaveURL(/\/proposals\/.+\/edit/)

    // Step 2
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: /Step 2/i })).toBeVisible()
    await page.locator('#member-name-0').fill('Test Engineer')
    await page.locator('#member-role-0').fill('Engineer')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3
    await expect(page.getByRole('heading', { name: /Step 3/i })).toBeVisible()
    await page.locator('#minFunding').fill('5000000')
    await page.locator('#deadline').fill(getFutureDateByDays(30))
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4: add a milestone target date → no error for valid date
    await expect(page.getByRole('heading', { name: /Step 4/i })).toBeVisible()
    const validTargetDate = getFutureDateByMonths(3)
    await page.locator('#ms-date-0').fill(validTargetDate)
    await page.keyboard.press('Tab')

    // No alert should be visible for a valid date
    await expect(page.getByRole('alert')).not.toBeVisible()
  })
})
