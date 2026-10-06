import { test, expect, type Page } from '@playwright/test'

const SUBMITTED_CAMPAIGN_ID = '00000000-0011-0000-0000-000000000011'
const SUBMITTED_CAMPAIGN_TITLE = 'Mars Soil Analyser'

const REJECTED_CAMPAIGN_ID = '00000000-0012-0000-0000-000000000012'
const REJECTED_CAMPAIGN_TITLE = 'Mars Dust Collector'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test.describe('Reviewer flow', () => {
  test('reviewer can see review queue with submitted campaign', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto('/review')
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible()
    await expect(page.getByText(SUBMITTED_CAMPAIGN_TITLE)).toBeVisible()
  })

  test('reviewer can claim a campaign and see Under Review status', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto('/review')
    await expect(page.getByText(SUBMITTED_CAMPAIGN_TITLE)).toBeVisible()

    // Click the Claim button for the submitted campaign
    await page.getByRole('button', { name: `Claim campaign: ${SUBMITTED_CAMPAIGN_TITLE}` }).click()

    // Should redirect to review detail page
    await expect(page).toHaveURL(`/review/${SUBMITTED_CAMPAIGN_ID}`)

    // Status should now show Under Review
    await expect(page.getByText('Under Review')).toBeVisible()
  })

  test('reviewer can approve a claimed campaign', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')
    await expect(page).toHaveURL('/')

    // Campaign was claimed by previous test — go straight to detail
    await page.goto(`/campaigns/${SUBMITTED_CAMPAIGN_ID}`)
    await expect(page.getByText('Under Review')).toBeVisible()

    // Approve the campaign
    const reviewPanel = page.getByLabel('Review actions')
    await expect(reviewPanel).toBeVisible()

    await reviewPanel.getByPlaceholder('Add approval notes…').fill('Looks good — approved.')
    await reviewPanel.getByRole('button', { name: 'Approve' }).click()

    // Status should change to Approved
    await expect(page.getByText('Approved')).toBeVisible()
  })
})

test.describe('Creator flow', () => {
  test('creator sees Resubmit button on a rejected campaign', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto(`/campaigns/${REJECTED_CAMPAIGN_ID}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(REJECTED_CAMPAIGN_TITLE)

    // ReviewActionsPanel should show for creator on rejected campaign
    const reviewPanel = page.getByLabel('Review actions')
    await expect(reviewPanel).toBeVisible()
    await expect(reviewPanel.getByRole('button', { name: 'Resubmit' })).toBeVisible()
  })

  test('creator can resubmit a rejected campaign', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto(`/campaigns/${REJECTED_CAMPAIGN_ID}`)
    await expect(page.getByText('Rejected', { exact: true })).toBeVisible()

    const reviewPanel = page.getByLabel('Review actions')
    await reviewPanel.getByRole('button', { name: 'Resubmit' }).click()

    // Status should change to Draft
    await expect(page.getByText('Draft')).toBeVisible()
  })
})

test.describe('Route protection', () => {
  test('non-reviewer is redirected away from review queue', async ({ page }) => {
    await login(page, 'backer@example.com', 'backer-demo-pass')
    await expect(page).toHaveURL('/')

    await page.goto('/review')
    await expect(page).not.toHaveURL('/review')
  })

  test('unauthenticated user is redirected to login from review queue', async ({ page }) => {
    await page.goto('/review')
    await expect(page).toHaveURL('/login')
  })
})
