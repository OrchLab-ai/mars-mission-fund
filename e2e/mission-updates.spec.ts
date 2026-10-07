import { test, expect, type Page } from '@playwright/test'

const LIVE_PROPOSAL_ID = '00000000-0001-0000-0000-000000000001'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
}

function updatesRegion(page: Page) {
  return page.getByRole('region', { name: 'Mission updates' })
}

test.describe('Mission updates', () => {
  test('creator posts an update and sees it at the top without a reload; readers see no form', async ({
    page,
    browser,
  }) => {
    const title = `E2E update ${Date.now()}`

    await login(page, 'creator@example.com', 'creator-demo-pass')
    await page.goto(`/proposals/${LIVE_PROPOSAL_ID}`)

    const region = updatesRegion(page)
    await expect(region).toBeVisible()
    await expect(region.getByRole('listitem').first()).toBeVisible()

    await page.evaluate(() => {
      ;(window as unknown as { __noReload: boolean }).__noReload = true
    })

    await region.getByLabel('Title').fill(title)
    await region.getByLabel("What's happening?").fill('First line\nSecond line')
    await region.getByRole('button', { name: 'Post update' }).click()

    await expect(region.getByRole('listitem').first()).toContainText(title)
    await expect(region.getByLabel('Title')).toHaveValue('')
    expect(
      await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)
    ).toBe(true)

    // Signed out, the same page shows the update and no form
    const readerContext = await browser.newContext()
    const readerPage = await readerContext.newPage()
    await readerPage.goto(`/proposals/${LIVE_PROPOSAL_ID}`)
    const readerRegion = updatesRegion(readerPage)
    await expect(readerRegion.getByRole('listitem').first()).toContainText(title)
    await expect(readerRegion.getByRole('button', { name: 'Post update' })).toHaveCount(0)
    await expect(readerRegion.getByLabel('Title')).toHaveCount(0)
    await readerContext.close()
  })
})
