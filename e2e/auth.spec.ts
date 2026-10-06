import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test.describe('Authentication', () => {
  test('demo card login — pre-fills form and logs in', async ({ page }) => {
    await page.goto('/login')

    // Click the Demo Admin card
    await page.getByRole('button', { name: /Demo Admin/ }).click()

    // Verify form is pre-filled
    await expect(page.getByLabel('Email')).toHaveValue('admin@example.com')
    await expect(page.getByLabel('Password')).toHaveValue('admin-demo-pass')

    // Submit
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Should redirect to home and show authenticated state
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Demo Admin')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  })

  test('manual login — type credentials directly', async ({ page }) => {
    await login(page, 'admin@example.com', 'admin-demo-pass')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  })

  test('invalid credentials — shows error', async ({ page }) => {
    await login(page, 'admin@example.com', 'wrong-password')

    // Should stay on login page with error
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('logout — returns to login page', async ({ page }) => {
    // Log in then navigate to a protected page
    await login(page, 'backer@example.com', 'backer-demo-pass')
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()

    // Go to protected route so logout triggers redirect
    await page.goto('/profile')
    await expect(page).toHaveURL('/profile')

    await page.getByRole('button', { name: 'Log out' }).click()

    // ProtectedRoute redirects unauthenticated users to /login
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible()
  })

  test('protected route redirect — unauthenticated user sent to login', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL('/login')
  })

  test('admin route protection — non-admin redirected away', async ({ page }) => {
    // Log in as backer (non-admin)
    await login(page, 'backer@example.com', 'backer-demo-pass')
    await expect(page).toHaveURL('/')

    // Try to access admin route
    await page.goto('/admin/users')

    // Should be redirected away (non-admin goes to /)
    await expect(page).not.toHaveURL('/admin/users')
  })
})
