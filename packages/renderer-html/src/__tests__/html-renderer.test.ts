import { describe, it, expect } from 'vitest'
import { renderToHtml } from '../html-renderer.js'
import type { RenderResult } from '@nextreport/engine-core'

function makeResult(overrides: Partial<RenderResult> = {}): RenderResult {
  return {
    pages: [],
    metadata: {
      totalPages: 0,
      generatedAt: '2026-04-11T00:00:00.000Z',
      locale: 'en-US',
    },
    ...overrides,
  }
}

describe('renderToHtml', () => {
  it('produces a complete HTML document with DOCTYPE', () => {
    const result = makeResult()
    const html = renderToHtml(result)
    expect(html).toMatch(/^<!DOCTYPE html>/i)
  })

  it('includes <html>, <head>, and <body> tags', () => {
    const result = makeResult()
    const html = renderToHtml(result)
    expect(html).toContain('<html')
    expect(html).toContain('<head>')
    expect(html).toContain('<body>')
    expect(html).toContain('</html>')
  })

  it('includes charset meta tag', () => {
    const result = makeResult()
    const html = renderToHtml(result)
    expect(html).toContain('charset')
    expect(html).toContain('UTF-8')
  })

  it('includes inline styles in head', () => {
    const result = makeResult()
    const html = renderToHtml(result)
    expect(html).toContain('<style>')
    expect(html).toContain('</style>')
  })

  it('handles empty result (no pages) without error', () => {
    const result = makeResult({ pages: [] })
    const html = renderToHtml(result)
    expect(html).toBeTruthy()
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('renders a single page as a div.page', () => {
    const result = makeResult({
      pages: [
        {
          number: 1,
          elements: [],
        },
      ],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result)
    expect(html).toContain('class="page"')
    expect(html).toContain('position:relative')
  })

  it('renders A4 page dimensions by default', () => {
    const result = makeResult({
      pages: [{ number: 1, elements: [] }],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result)
    // A4 portrait: 595pt wide, 842pt tall
    expect(html).toContain('width:595pt')
    expect(html).toContain('height:842pt')
  })

  it('renders A3 page dimensions when specified', () => {
    const result = makeResult({
      pages: [{ number: 1, elements: [] }],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result, { pageSize: 'A3' })
    expect(html).toContain('width:842pt')
    expect(html).toContain('height:1191pt')
  })

  it('renders Letter page dimensions when specified', () => {
    const result = makeResult({
      pages: [{ number: 1, elements: [] }],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result, { pageSize: 'Letter' })
    expect(html).toContain('width:612pt')
    expect(html).toContain('height:792pt')
  })

  it('renders Legal page dimensions when specified', () => {
    const result = makeResult({
      pages: [{ number: 1, elements: [] }],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result, { pageSize: 'Legal' })
    expect(html).toContain('width:612pt')
    expect(html).toContain('height:1008pt')
  })

  it('swaps width/height for landscape orientation', () => {
    const result = makeResult({
      pages: [{ number: 1, elements: [] }],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result, { pageSize: 'A4', orientation: 'landscape' })
    // landscape A4: 842 wide, 595 tall
    expect(html).toContain('width:842pt')
    expect(html).toContain('height:595pt')
  })

  it('adds page-break-after:always to each page', () => {
    const result = makeResult({
      pages: [
        { number: 1, elements: [] },
        { number: 2, elements: [] },
      ],
      metadata: { totalPages: 2, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result)
    expect(html).toContain('page-break-after:always')
  })

  it('renders multiple pages', () => {
    const result = makeResult({
      pages: [
        { number: 1, elements: [] },
        { number: 2, elements: [] },
        { number: 3, elements: [] },
      ],
      metadata: { totalPages: 3, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result)
    const pageCount = (html.match(/class="page"/g) ?? []).length
    expect(pageCount).toBe(3)
  })

  it('renders text elements within pages', () => {
    const result = makeResult({
      pages: [
        {
          number: 1,
          elements: [
            {
              type: 'text',
              bandType: 'header',
              position: { x: 10, y: 20, width: 200, height: 30 },
              properties: {
                content: 'Invoice Header',
                fontSize: 16,
                fontWeight: 'bold',
                color: '#000000',
                textAlign: 'left',
              },
            },
          ],
        },
      ],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result)
    expect(html).toContain('Invoice Header')
    expect(html).toContain('font-size:16pt')
  })

  it('renders unknown element types as HTML comments', () => {
    const result = makeResult({
      pages: [
        {
          number: 1,
          elements: [
            {
              type: 'chart',
              bandType: 'detail',
              position: { x: 0, y: 0, width: 100, height: 100 },
              properties: {},
            },
          ],
        },
      ],
      metadata: { totalPages: 1, generatedAt: '2026-04-11T00:00:00.000Z', locale: 'en-US' },
    })
    const html = renderToHtml(result)
    expect(html).toContain('<!--')
    expect(html).toContain('chart')
  })
})
