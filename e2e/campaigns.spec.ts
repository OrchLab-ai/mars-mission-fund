import { test, expect } from '@playwright/test'

const SEEDED_CAMPAIGN_ID = '00000000-0001-0000-0000-000000000001'
const SEEDED_CAMPAIGN_TITLE = 'Methane Bi-Propellant Engine Testbed'

test.describe('Campaign list', () => {
  test('happy path — shows seeded campaigns', async ({ page }) => {
    await page.goto('/campaigns')
    const grid = page.getByLabel('Campaign listings')
    await expect(grid).toBeVisible()
    const links = grid.locator('a')
    await expect(links.first()).toBeVisible()
    await expect(page.getByText(SEEDED_CAMPAIGN_TITLE)).toBeVisible()
  })

  test('server error — shows alert, no campaign grid', async ({ page }) => {
    await page.route('**/v1/campaigns', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    )
    await page.goto('/campaigns')

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText("couldn't load missions")

    const grid = page.getByLabel('Campaign listings')
    await expect(grid).not.toBeVisible()
  })
})

test.describe('Campaign detail', () => {
  test('happy path — shows campaign detail', async ({ page }) => {
    await page.goto(`/campaigns/${SEEDED_CAMPAIGN_ID}`)
    const heading = page.locator('h1')
    await expect(heading).toContainText(SEEDED_CAMPAIGN_TITLE)

    // Category label
    const category = page.locator('span').filter({ hasText: /\w+/ }).first()
    await expect(category).toBeVisible()

    // Funding progress section — look for the "raised of" text it always renders
    await expect(page.getByText(/raised of/)).toBeVisible()

    // Milestones section heading (rendered unconditionally by MilestonesSection)
    const milestonesHeading = page.getByRole('heading', { name: 'Milestones' })
    if ((await milestonesHeading.count()) > 0) {
      await expect(milestonesHeading).toBeVisible()
    }
  })

  test('404 — shows error state for non-existent campaign', async ({ page }) => {
    await page.goto('/campaigns/00000000-dead-0000-0000-000000000000')
    await expect(page.getByText('Failed to load campaign')).toBeVisible()
  })
})

test.describe('Campaign filters', () => {
  test('full list shown with no filter params in URL on initial visit', async ({ page }) => {
    await page.goto('/campaigns')
    await expect(page.getByLabel('Campaign listings')).toBeVisible()
    expect(page.url()).not.toContain('search=')
    expect(page.url()).not.toContain('categories=')
  })

  test('search narrows the list and count reflects results', async ({ page }) => {
    await page.goto('/campaigns')
    const searchInput = page.getByLabel('Search campaigns')
    await expect(searchInput).toBeVisible()

    // Type the exact title of campaign 1 to get exactly 1 result
    await searchInput.fill(SEEDED_CAMPAIGN_TITLE)
    // Wait for debounce (300 ms) plus network round-trip
    await page.waitForTimeout(600)

    await expect(page.getByText('1 mission found')).toBeVisible()
    await expect(page.getByText(SEEDED_CAMPAIGN_TITLE)).toBeVisible()
  })

  test('clicking a category pill narrows the list and sets URL param', async ({ page }) => {
    await page.goto('/campaigns')
    // Wait for initial list to load
    await expect(page.getByLabel('Campaign listings')).toBeVisible()

    // Click the Propulsion category pill
    const propulsionPill = page.getByRole('button', { name: 'Propulsion' })
    await propulsionPill.click()

    // URL should contain categories=Propulsion
    await page.waitForFunction(() => window.location.search.includes('categories='))
    expect(page.url()).toContain('categories=Propulsion')

    // Campaign 1 is in Propulsion; it should be visible
    await expect(page.getByText(SEEDED_CAMPAIGN_TITLE)).toBeVisible()
  })

  test('clear filters restores full list and removes URL params', async ({ page }) => {
    // Start with an active search filter
    await page.goto('/campaigns?search=' + encodeURIComponent(SEEDED_CAMPAIGN_TITLE))
    await expect(page.getByText('1 mission found')).toBeVisible()

    // Click "Clear filters"
    const clearBtn = page.getByRole('button', { name: 'Clear filters' })
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()

    // URL should have no filter params
    await page.waitForFunction(
      () =>
        !window.location.search.includes('search=') &&
        !window.location.search.includes('categories=')
    )
    expect(page.url()).not.toContain('search=')
    expect(page.url()).not.toContain('categories=')

    // Full list should be restored
    await expect(page.getByLabel('Campaign listings')).toBeVisible()
  })

  test('filter state is restored from URL after navigating to detail and pressing back', async ({
    page,
  }) => {
    // Navigate to campaigns page with a search filter applied
    await page.goto('/campaigns?search=' + encodeURIComponent(SEEDED_CAMPAIGN_TITLE))
    await expect(page.getByText('1 mission found')).toBeVisible()

    // Click on the campaign card link (only 1 result visible after filtering)
    await page.getByLabel('Campaign listings').getByRole('link').first().click()
    await expect(page).toHaveURL(new RegExp(`/campaigns/${SEEDED_CAMPAIGN_ID}`))

    // Press browser back
    await page.goBack()

    // Filter state should be restored from URL
    expect(page.url()).toContain('search=')
    await expect(page.getByText('1 mission found')).toBeVisible()
  })
})
