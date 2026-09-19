import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
}

test.describe('Proposal review step — deadline formatting', () => {
  test('shows human-readable deadline on Step 7 review screen', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')

    await page.goto('/proposals/new')
    await expect(page.getByRole('heading', { name: /Step 1/i })).toBeVisible()

    // Step 1: Mission Objectives
    await page.locator('#title').fill('Deadline Format Review Test')
    await page.locator('#category').selectOption({ index: 1 })
    await page.locator('#summary').fill('Testing deadline format on Step 7 review screen.')
    await page.locator('#description').fill('Full description for deadline format review test.')
    await page
      .locator('#alignmentStatement')
      .fill('Ensures deadline displays as human-readable date.')
    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page).toHaveURL(/\/proposals\/.+\/edit/)

    // Step 2: Team Members
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: /Step 2/i })).toBeVisible()
    await page.locator('#member-name-0').fill('Test Engineer')
    await page.locator('#member-role-0').fill('Lead Engineer')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3: Funding Goals — set a specific deadline
    await expect(page.getByRole('heading', { name: /Step 3/i })).toBeVisible()
    await page.locator('#minFunding').fill('5000000')
    await page.locator('#deadline').fill('2026-12-27')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4: Milestones
    await expect(page.getByRole('heading', { name: /Step 4/i })).toBeVisible()
    await page.locator('#ms-title-0').fill('Phase 1')
    await page.locator('#ms-pct-0').fill('60')
    await page.locator('#ms-title-1').fill('Phase 2')
    await page.locator('#ms-pct-1').fill('40')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 5: Risk Disclosures
    await expect(page.getByRole('heading', { name: /Step 5/i })).toBeVisible()
    await page.getByLabel('Risk disclosure 1').fill('Technical risk: potential delays.')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 6: Media (skip)
    await expect(page.getByRole('heading', { name: /Step 6/i })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 7: Review & Submit — verify formatted deadline
    await expect(page.getByRole('heading', { name: /Step 7/i })).toBeVisible()
    await expect(page.getByText('Dec 27, 2026')).toBeVisible()
    await expect(page.getByText('2026-12-27')).not.toBeVisible()
  })
})
