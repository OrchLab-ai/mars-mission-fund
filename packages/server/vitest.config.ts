import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // dist/ holds tsc's compiled copies of the tests, and tsc never deletes an output
    // whose source is gone. Collected, a renamed test file runs twice - once as itself,
    // once as its stale old name, against routes that no longer exist.
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
})
