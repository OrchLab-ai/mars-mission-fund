import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test.describe('Mobile nav — Notifications link', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('Backer can navigate to Notifications via mobile nav', async ({ page }) => {
    await login(page, 'backer@example.com', 'backer-demo-pass')
    await expect(page).toHaveURL('/')

    // Open the hamburger menu
    await page.getByRole('button', { name: 'Toggle navigation' }).click()

    // Notifications link should be visible
    const notificationsLink = page.getByRole('link', { name: 'Notifications' })
    await expect(notificationsLink).toBeVisible()

    // Click it — should navigate to /notifications and close the menu
    await notificationsLink.click()

    await expect(page).toHaveURL('/notifications')

    // Menu should be closed (hamburger no longer expanded)
    await expect(page.getByRole('button', { name: 'Toggle navigation' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  test('unauthenticated user does not see Notifications link in mobile nav', async ({ page }) => {
    await page.goto('/')

    // Open the hamburger menu
    await page.getByRole('button', { name: 'Toggle navigation' }).click()

    // Notifications link should NOT be visible
    await expect(page.getByRole('link', { name: 'Notifications' })).not.toBeVisible()
  })
})
