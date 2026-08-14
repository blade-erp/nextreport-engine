import { describe, it, expect, vi } from 'vitest'

// Records whether the puppeteer module has been evaluated. A mock factory runs
// on first import of the mocked module, so this flips exactly when something
// pulls puppeteer in — which is what the lazy import is there to control.
const puppeteer = vi.hoisted(() => ({ evaluated: false }))

vi.mock('puppeteer', () => {
  puppeteer.evaluated = true
  return {
    default: {
      launch: async () => ({
        newPage: async () => ({
          setContent: async () => {},
          pdf: async () => Buffer.from('%PDF-1.4 stub'),
        }),
        close: async () => {},
      }),
    },
  }
})

describe('puppeteer is an optional dependency', () => {
  it('is not loaded by importing the renderer, only by calling renderToPdf', async () => {
    const { renderToPdf } = await import('../pdf-renderer.js')

    // Importing the module must not require puppeteer to be installed: HTML-only
    // consumers import the engine without ever rendering a PDF.
    expect(puppeteer.evaluated).toBe(false)

    await renderToPdf('<html><body>hi</body></html>')

    expect(puppeteer.evaluated).toBe(true)
  })
})
