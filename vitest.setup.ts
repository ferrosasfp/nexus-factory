import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// globals: false → Testing Library no limpia el DOM solo entre tests
afterEach(() => {
  cleanup()
})
