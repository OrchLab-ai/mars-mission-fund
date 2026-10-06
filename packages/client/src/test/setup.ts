import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom does not implement HTMLDialogElement — provide a minimal stub so tests
// can mock showModal/close on dialog elements.
if (typeof HTMLDialogElement === 'undefined') {
  class DialogElement extends HTMLElement {
    showModal() {}
    close() {}
  }
  Object.defineProperty(globalThis, 'HTMLDialogElement', {
    value: DialogElement,
    writable: true,
    configurable: true,
  })
}
