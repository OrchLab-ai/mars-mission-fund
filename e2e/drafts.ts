import { expect, type Page } from '@playwright/test'

/**
 * Saves a NEW campaign and waits until the edit page has really taken over.
 *
 * Saving on /campaigns/new navigates to /campaigns/:id/edit, but the URL changes before
 * React swaps the page: for a moment the old form is still on screen, with the same
 * "Step 1" heading. A test that carries on into it loses that work when the edit page
 * mounts and loads the draft back at step 1. The edit page sets the document title only
 * once the draft has loaded, so wait for that, then for the loaded title in the form.
 */
export async function saveNewDraft(page: Page) {
  await page.getByRole('button', { name: /save draft/i }).click()
  await expect(page).toHaveURL(/\/campaigns\/.+\/edit/)
  await expect(page).toHaveTitle(/ — Edit — /)
  await expect(page.locator('#title')).not.toHaveValue('')
}

/**
 * Saves an existing draft and waits for the server to confirm it.
 *
 * Waiting for the button to re-enable is not enough: that check can run before React has
 * disabled it, and pass while the save is still in flight. A submit straight after then
 * races the save, and the server rejects a draft it has only half received.
 */
export async function saveDraft(page: Page) {
  const saved = page.waitForResponse(
    (r) =>
      r.request().method() === 'PUT' && /^\/v1\/campaigns\/[^/]+$/.test(new URL(r.url()).pathname)
  )
  await page.getByRole('button', { name: /save draft/i }).click()
  expect((await saved).ok()).toBe(true)
}
