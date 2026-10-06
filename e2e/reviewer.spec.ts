import { test, expect, type Page } from '@playwright/test'

const REVIEWER_CAMPAIGN_ID = '00000000-0013-0000-0000-000000000013'
const REVIEWER_CAMPAIGN_TITLE = 'Mars Atmospheric Sampler'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test.describe('Reviewer flow — /review/:id', () => {
  test('reviewer queue loads at /review', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto('/review')
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible()
    await expect(page.getByText(REVIEWER_CAMPAIGN_TITLE)).toBeVisible()
  })

  test('claiming a campaign redirects to /review/:id', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto('/review')
    await expect(page.getByText(REVIEWER_CAMPAIGN_TITLE)).toBeVisible()

    await page.getByRole('button', { name: `Claim campaign: ${REVIEWER_CAMPAIGN_TITLE}` }).click()

    await expect(page).toHaveURL(`/review/${REVIEWER_CAMPAIGN_ID}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(REVIEWER_CAMPAIGN_TITLE)
    await expect(page.getByText('Under Review')).toBeVisible()
  })

  test('review detail page shows full proposal sections', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')
    await expect(page).toHaveURL('/')

    // Campaign was claimed in prior test — navigate directly
    await page.goto(`/review/${REVIEWER_CAMPAIGN_ID}`)
    await expect(page.getByText('Under Review')).toBeVisible()

    // Shows campaign title
    await expect(page.getByRole('heading', { level: 1 })).toContainText(REVIEWER_CAMPAIGN_TITLE)

    // ReviewActionsPanel is visible for assigned reviewer
    await expect(page.getByLabel('Review actions')).toBeVisible()
    await expect(page.getByPlaceholder('Add approval notes…')).toBeVisible()
  })

  test('reviewer can approve a claimed campaign from /review/:id', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')
    await expect(page).toHaveURL('/')

    // Campaign was claimed by previous test — go straight to review detail
    await page.goto(`/review/${REVIEWER_CAMPAIGN_ID}`)
    await expect(page.getByText('Under Review')).toBeVisible()

    const reviewPanel = page.getByLabel('Review actions')
    await expect(reviewPanel).toBeVisible()

    await reviewPanel
      .getByPlaceholder('Add approval notes…')
      .fill('Proposal looks solid — approved.')
    await reviewPanel.getByRole('button', { name: 'Approve' }).click()

    // Status should change to Approved
    await expect(page.getByText('Approved')).toBeVisible()
  })

  test('non-reviewer is redirected away from /review/:id', async ({ page }) => {
    await login(page, 'backer@example.com', 'backer-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto(`/review/${REVIEWER_CAMPAIGN_ID}`)
    await expect(page).not.toHaveURL(`/review/${REVIEWER_CAMPAIGN_ID}`)
  })
})
