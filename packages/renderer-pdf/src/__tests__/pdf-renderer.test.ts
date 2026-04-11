import { describe, it, expect } from 'vitest'
import { renderToPdf } from '../pdf-renderer.js'

describe('renderToPdf', () => {
  it('produces a Uint8Array with PDF magic bytes', async () => {
    const html = '<html><body><h1>Test</h1></body></html>'
    const result = await renderToPdf(html)

    expect(result).toBeInstanceOf(Uint8Array)

    // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
    expect(result[0]).toBe(0x25) // %
    expect(result[1]).toBe(0x50) // P
    expect(result[2]).toBe(0x44) // D
    expect(result[3]).toBe(0x46) // F
  }, 30_000)
})
