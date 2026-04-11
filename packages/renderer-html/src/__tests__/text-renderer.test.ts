import { describe, it, expect } from 'vitest'
import { renderText } from '../component-renderers/text-renderer.js'
import type { ResolvedElement } from '@nextreport/engine-core'

function makeTextElement(overrides: Partial<ResolvedElement['properties']> = {}): ResolvedElement {
  return {
    type: 'text',
    bandType: 'detail',
    position: { x: 10, y: 20, width: 200, height: 30 },
    properties: {
      content: 'Hello World',
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
      ...overrides,
    },
  }
}

describe('renderText', () => {
  it('renders a div with absolute position styles', () => {
    const el = makeTextElement()
    const html = renderText(el)
    expect(html).toContain('position:absolute')
    expect(html).toContain('left:10pt')
    expect(html).toContain('top:20pt')
    expect(html).toContain('width:200pt')
    expect(html).toContain('height:30pt')
  })

  it('applies fontSize in pt', () => {
    const el = makeTextElement({ fontSize: 18 })
    const html = renderText(el)
    expect(html).toContain('font-size:18pt')
  })

  it('applies fontWeight', () => {
    const el = makeTextElement({ fontWeight: 'bold' })
    const html = renderText(el)
    expect(html).toContain('font-weight:bold')
  })

  it('applies color', () => {
    const el = makeTextElement({ color: '#ff0000' })
    const html = renderText(el)
    expect(html).toContain('color:#ff0000')
  })

  it('applies textAlign', () => {
    const el = makeTextElement({ textAlign: 'center' })
    const html = renderText(el)
    expect(html).toContain('text-align:center')
  })

  it('renders content inside the div', () => {
    const el = makeTextElement({ content: 'Acme Corp' })
    const html = renderText(el)
    expect(html).toContain('Acme Corp')
  })

  it('escapes < in content', () => {
    const el = makeTextElement({ content: '<script>' })
    const html = renderText(el)
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('escapes > in content', () => {
    const el = makeTextElement({ content: 'a > b' })
    const html = renderText(el)
    expect(html).toContain('a &gt; b')
  })

  it('escapes & in content', () => {
    const el = makeTextElement({ content: 'foo & bar' })
    const html = renderText(el)
    expect(html).toContain('foo &amp; bar')
  })

  it('escapes " in content', () => {
    const el = makeTextElement({ content: 'say "hello"' })
    const html = renderText(el)
    expect(html).toContain('say &quot;hello&quot;')
  })

  it("escapes ' in content", () => {
    const el = makeTextElement({ content: "it's" })
    const html = renderText(el)
    expect(html).toContain('it&#39;s')
  })

  it('handles missing content gracefully (undefined)', () => {
    const el = makeTextElement({ content: undefined })
    const html = renderText(el)
    expect(html).toContain('<div')
    expect(html).not.toContain('undefined')
  })

  it('handles empty string content', () => {
    const el = makeTextElement({ content: '' })
    const html = renderText(el)
    expect(html).toContain('<div')
  })

  it('wraps content in a div tag', () => {
    const el = makeTextElement()
    const html = renderText(el)
    expect(html).toMatch(/^<div/)
    expect(html).toMatch(/<\/div>$/)
  })
})
