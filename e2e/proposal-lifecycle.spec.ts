import { test, expect, type Page } from '@playwright/test'

const LIFECYCLE_SUBMITTED_ID = '00000000-0014-0000-0000-000000000014'
const LIFECYCLE_REJECT_ID = '00000000-0016-0000-0000-000000000016'
const LIFECYCLE_SETTLEMENT_ID = '00000000-0017-0000-0000-000000000017'
const LIFECYCLE_CANCEL_ID = '00000000-0018-0000-0000-000000000018'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
}

async function logout(page: Page) {
  // Use a public page so ProtectedRoute doesn't inject from-state
  // that would redirect the next login back to /profile instead of /
  await page.goto('/about')
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('button', { name: 'Log out' })).not.toBeVisible()
}

/** Returns an ISO date string N months from today. */
function getFutureDate(monthsAhead: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + monthsAhead)
  return date.toISOString().split('T')[0]
}

test.describe('Proposal lifecycle', () => {
  test('creator submits a draft proposal', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await page.goto('/dashboard')

    await page
      .getByRole('link', { name: /New Proposal/i })
      .first()
      .click()
    await expect(page).toHaveURL('/proposals/new')
    await expect(page.getByRole('heading', { name: /Step 1/i })).toBeVisible()

    // Step 1: Mission Objectives
    await page.locator('#title').fill('Lifecycle Draft Test')
    await page.locator('#category').selectOption({ index: 1 })
    await page.locator('#summary').fill('A lifecycle E2E test proposal.')
    await page
      .locator('#description')
      .fill('Full description for the lifecycle draft test proposal.')
    await page
      .locator('#alignmentStatement')
      .fill('Demonstrates reliable lifecycle testing for Mars mission proposals.')

    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page).toHaveURL(/\/proposals\/.+\/edit/)
    await expect(page.getByRole('heading', { name: /Step 1/i })).toBeVisible()

    // Step 2: Team Members
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: /Step 2/i })).toBeVisible()
    await page.locator('#member-name-0').fill('Alice Engineer')
    await page.locator('#member-role-0').fill('Lead Engineer')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3: Funding Goals
    await expect(page.getByRole('heading', { name: /Step 3/i })).toBeVisible()
    await page.locator('#minFunding').fill('5000000')
    await page.locator('#maxFunding').fill('10000000')
    await page.locator('#deadline').fill(getFutureDate(2))
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4: Milestones
    await expect(page.getByRole('heading', { name: /Step 4/i })).toBeVisible()
    await page.locator('#ms-title-0').fill('Design Phase')
    await page.locator('#ms-pct-0').fill('60')
    await page.locator('#ms-title-1').fill('Build Phase')
    await page.locator('#ms-pct-1').fill('40')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 5: Risk Disclosures
    await expect(page.getByRole('heading', { name: /Step 5/i })).toBeVisible()
    await page
      .getByLabel('Risk disclosure 1')
      .fill('Technical risk: propulsion system complexity may delay the timeline.')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 6: Media (skip)
    await expect(page.getByRole('heading', { name: /Step 6/i })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 7: Review & Submit
    await expect(page.getByRole('heading', { name: /Review/i })).toBeVisible()
    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page.getByRole('button', { name: /save draft/i })).not.toBeDisabled()

    await page.getByRole('button', { name: /submit.*review/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm Submission' }).click()

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Lifecycle Draft Test').first()).toBeVisible()
  })

  test('reviewer approves a submitted proposal with notes', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')

    await page.goto('/review')
    await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible()
    await expect(page.getByText('Mars Lifecycle Submitted')).toBeVisible()

    // Claim the proposal
    await page.getByRole('button', { name: 'Claim proposal: Mars Lifecycle Submitted' }).click()
    await expect(page).toHaveURL(`/review/${LIFECYCLE_SUBMITTED_ID}`)
    await expect(page.getByText('Under Review')).toBeVisible()

    // Navigate to proposal detail to use ReviewActionsPanel
    await page.goto(`/proposals/${LIFECYCLE_SUBMITTED_ID}`)
    const reviewPanel = page.getByLabel('Review actions')
    await expect(reviewPanel).toBeVisible()

    await reviewPanel.getByPlaceholder('Add approval notes…').fill('Looks good — approved.')
    await reviewPanel.getByRole('button', { name: 'Approve' }).click()

    await expect(page.getByText('Approved', { exact: true })).toBeVisible()
  })

  test('creator launches an approved proposal', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await page.goto('/dashboard')

    await expect(page.getByText('Mars Lifecycle Approved')).toBeVisible()

    await page.getByRole('button', { name: 'Launch Mars Lifecycle Approved' }).click()

    // After launch, status should be Live
    await expect(
      page.locator('tr', { has: page.getByText('Mars Lifecycle Approved') }).getByText('Live')
    ).toBeVisible()

    // Navigate to proposals list to verify public visibility
    await page.goto('/proposals')
    await expect(page.getByText('Mars Lifecycle Approved')).toBeVisible()
  })

  test('reviewer rejects a proposal; creator sees Resubmit', async ({ page }) => {
    await login(page, 'reviewer@example.com', 'reviewer-demo-pass')

    await page.goto('/review')
    await expect(page.getByText('Mars Lifecycle Reject Test')).toBeVisible()

    // Claim the proposal
    await page.getByRole('button', { name: 'Claim proposal: Mars Lifecycle Reject Test' }).click()
    await expect(page).toHaveURL(`/review/${LIFECYCLE_REJECT_ID}`)

    // Navigate to proposal detail for review actions
    await page.goto(`/proposals/${LIFECYCLE_REJECT_ID}`)
    const reviewPanel = page.getByLabel('Review actions')
    await expect(reviewPanel).toBeVisible()

    await reviewPanel
      .getByPlaceholder('Explain why the proposal is being rejected…')
      .fill('Insufficient technical detail.')
    await reviewPanel
      .getByPlaceholder('Provide guidance for resubmission…')
      .fill('Add more engineering specifics.')
    await reviewPanel.getByRole('button', { name: 'Reject' }).click()

    await expect(page.getByText('Rejected', { exact: true })).toBeVisible()

    // Switch to creator
    await logout(page)
    await login(page, 'creator@example.com', 'creator-demo-pass')

    await page.goto(`/proposals/${LIFECYCLE_REJECT_ID}`)
    const creatorReviewPanel = page.getByLabel('Review actions')
    await expect(creatorReviewPanel).toBeVisible()
    await expect(creatorReviewPanel.getByRole('button', { name: 'Resubmit' })).toBeVisible()
  })

  test('creator submits milestone evidence; admin verifies milestone', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')

    await page.goto(`/proposals/${LIFECYCLE_SETTLEMENT_ID}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Mars Lifecycle Settlement')

    // SubmitEvidencePanel renders for Pending milestones (Phase 1: Hardware Delivery)
    const evidencePanel = page.getByLabel('Submit milestone evidence')
    await expect(evidencePanel).toBeVisible()

    await evidencePanel
      .getByPlaceholder('Describe the evidence for this milestone…')
      .fill('Hardware batch delivered and inspected. Shipping manifests attached.')
    await evidencePanel.getByRole('button', { name: 'Submit Evidence' }).click()
    // After submission, the milestone transitions from Pending to Submitted.
    // The panel only renders for Pending/Returned milestones, so it disappears.
    await expect(evidencePanel).not.toBeVisible()

    // Switch to admin to verify Phase 2 (already Submitted with evidence)
    await logout(page)
    await login(page, 'admin@example.com', 'admin-demo-pass')

    await page.goto(`/proposals/${LIFECYCLE_SETTLEMENT_ID}`)
    const adminPanel = page.getByLabel('Admin actions')
    await expect(adminPanel).toBeVisible()

    // Both Phase 1 (just submitted by creator) and Phase 2 (seeded as Submitted)
    // appear in the admin panel. Click Verify on Phase 2 (the second one).
    await adminPanel.getByRole('button', { name: 'Verify' }).nth(1).click()

    // After verification, the milestone should no longer show in the admin panel
    // (it transitions from Submitted to Verified)
    await expect(adminPanel.getByText('Phase 2: Integration Testing')).not.toBeVisible()
  })

  test('creator requests cancellation; admin approves it', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await page.goto('/dashboard')

    await expect(page.getByText('Mars Lifecycle Cancel')).toBeVisible()

    // Accept the confirmation dialog
    page.on('dialog', (dialog) => dialog.accept())

    // Cancel button — contributor_count=3, so Branch B (requestCancellation)
    await page.getByRole('button', { name: 'Cancel Mars Lifecycle Cancel' }).click()

    // Proposal should still be visible (not immediately cancelled)
    await expect(page.getByText('Mars Lifecycle Cancel')).toBeVisible()

    // Switch to admin
    await logout(page)
    await login(page, 'admin@example.com', 'admin-demo-pass')

    await page.goto(`/proposals/${LIFECYCLE_CANCEL_ID}`)
    const adminPanel = page.getByLabel('Admin actions')
    await expect(adminPanel).toBeVisible()
    await expect(adminPanel.getByText('Pending Cancellation Request')).toBeVisible()

    await adminPanel.getByRole('button', { name: 'Approve Cancellation' }).click()

    await expect(page.getByText('Cancelled', { exact: true })).toBeVisible()
  })

  test('creator can mark a notification as read', async ({ page }) => {
    await login(page, 'creator@example.com', 'creator-demo-pass')
    await page.goto('/notifications')

    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    await expect(page.getByText('Proposal Approved').first()).toBeVisible()

    // Prior tests create additional "Proposal Approved" notifications.
    // Count mark-read buttons before and after clicking one.
    const markReadButtons = page.getByRole('button', {
      name: 'Mark notification as read: Proposal Approved',
    })
    const initialCount = await markReadButtons.count()
    expect(initialCount).toBeGreaterThan(0)

    await markReadButtons.first().click()

    // One fewer mark-read button after marking as read
    await expect(markReadButtons).toHaveCount(initialCount - 1)
  })
})
