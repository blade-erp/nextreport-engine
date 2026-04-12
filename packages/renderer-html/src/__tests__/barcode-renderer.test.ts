import { describe, it, expect, beforeAll } from 'vitest'
import { renderBarcode, bwipReady } from '../component-renderers/barcode-renderer.js'
import type { ResolvedElement } from '@nextreport/engine-core'

function makeBarcodeElement(
  overrides: Partial<ResolvedElement['properties']> = {},
): ResolvedElement {
  return {
    type: 'barcode',
    bandType: 'header',
    position: { x: 10, y: 20, width: 100, height: 100 },
    properties: {
      value: 'https://example.com',
      format: 'qr',
      color: '#000000',
      backgroundColor: '#ffffff',
      ...overrides,
    },
  }
}

beforeAll(async () => {
  await bwipReady
})

describe('renderBarcode', () => {
  it('renders a QR code as SVG inside a container div', () => {
    const el = makeBarcodeElement()
    const html = renderBarcode(el)
    expect(html).toContain('position:absolute')
    expect(html).toContain('left:10pt')
    expect(html).toContain('top:20pt')
    expect(html).toContain('<svg')
  })

  it('renders a Code128 barcode', () => {
    const el = makeBarcodeElement({ value: 'INV-2026-001', format: 'code128' })
    const html = renderBarcode(el)
    expect(html).toContain('<svg')
  })

  it('shows placeholder for empty value', () => {
    const el = makeBarcodeElement({ value: '' })
    const html = renderBarcode(el)
    expect(html).toContain('No value')
    expect(html).not.toContain('<svg')
  })

  it('handles missing value gracefully', () => {
    const el = makeBarcodeElement({ value: undefined })
    const html = renderBarcode(el)
    expect(html).toContain('No value')
  })

  it('wraps SVG in a flex container for centering', () => {
    const el = makeBarcodeElement()
    const html = renderBarcode(el)
    expect(html).toContain('display:flex')
    expect(html).toContain('align-items:center')
    expect(html).toContain('justify-content:center')
  })

  it('applies width and height to container', () => {
    const el = makeBarcodeElement()
    el.position = { x: 0, y: 0, width: 150, height: 80 }
    const html = renderBarcode(el)
    expect(html).toContain('width:150pt')
    expect(html).toContain('height:80pt')
  })

  it('defaults format to qr', () => {
    const el = makeBarcodeElement({ format: undefined })
    const html = renderBarcode(el)
    expect(html).toContain('<svg')
  })
})
