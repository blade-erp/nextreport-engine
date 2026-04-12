import { describe, it, expect } from 'vitest'
import { renderImage } from '../component-renderers/image-renderer.js'
import type { ResolvedElement } from '@nextreport/engine-core'

function makeImageElement(overrides: Partial<ResolvedElement['properties']> = {}): ResolvedElement {
  return {
    type: 'image',
    bandType: 'header',
    position: { x: 10, y: 20, width: 200, height: 100 },
    properties: {
      src: 'https://example.com/logo.png',
      alt: 'Company Logo',
      objectFit: 'contain',
      ...overrides,
    },
  }
}

describe('renderImage', () => {
  it('renders an img tag with absolute position styles', () => {
    const el = makeImageElement()
    const html = renderImage(el)
    expect(html).toContain('<img')
    expect(html).toContain('position:absolute')
    expect(html).toContain('left:10pt')
    expect(html).toContain('top:20pt')
    expect(html).toContain('width:200pt')
    expect(html).toContain('height:100pt')
  })

  it('includes src attribute', () => {
    const el = makeImageElement({ src: 'https://cdn.example.com/logo.svg' })
    const html = renderImage(el)
    expect(html).toContain('src="https://cdn.example.com/logo.svg"')
  })

  it('includes alt attribute', () => {
    const el = makeImageElement({ alt: 'My Logo' })
    const html = renderImage(el)
    expect(html).toContain('alt="My Logo"')
  })

  it('applies object-fit style', () => {
    const el = makeImageElement({ objectFit: 'cover' })
    const html = renderImage(el)
    expect(html).toContain('object-fit:cover')
  })

  it('handles base64 src', () => {
    const base64 = 'data:image/png;base64,iVBORw0KGgo='
    const el = makeImageElement({ src: base64 })
    const html = renderImage(el)
    expect(html).toContain(`src="${base64}"`)
  })

  it('escapes special characters in alt', () => {
    const el = makeImageElement({ alt: 'Logo & "Brand"' })
    const html = renderImage(el)
    expect(html).toContain('alt="Logo &amp; &quot;Brand&quot;"')
  })

  it('handles missing src gracefully', () => {
    const el = makeImageElement({ src: undefined })
    const html = renderImage(el)
    expect(html).toContain('src=""')
  })

  it('handles missing alt gracefully', () => {
    const el = makeImageElement({ alt: undefined })
    const html = renderImage(el)
    expect(html).toContain('alt=""')
  })

  it('defaults objectFit to contain', () => {
    const el = makeImageElement({ objectFit: undefined })
    const html = renderImage(el)
    expect(html).toContain('object-fit:contain')
  })

  it('is a self-closing img tag', () => {
    const el = makeImageElement()
    const html = renderImage(el)
    expect(html).toMatch(/\/>$/)
  })
})
