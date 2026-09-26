import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  // .vite/ is Vite's dependency cache - bundled third-party code, written on the first
  // dev-server run. ESLint does not read .gitignore, so without this `npm run lint` (and
  // ci-check.sh) failed on every machine that had started the app.
  { ignores: ['**/dist/', '**/node_modules/', '**/coverage/', '**/.vite/'] },
  // Base TypeScript rules for all packages
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  // Client-only: React rules applied only to packages/client
  {
    files: ['packages/client/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
    settings: { react: { version: 'detect' } },
  }
)
