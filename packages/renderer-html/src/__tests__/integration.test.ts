import { describe, it, expect } from 'vitest'
import { renderReport } from '@nextreport/engine-core'
import type { Report } from '@nextreport/schema'
import { renderToHtml } from '../html-renderer.js'

const invoiceSchema: Report = {
  version: '1.0',
  type: 'report',
  locale: 'en-US',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
  },
  dataSource: { type: 'json' },
  bands: [
    {
      type: 'header',
      height: 60,
      components: [
        {
          type: 'text',
          position: { x: 0, y: 0, width: 400, height: 30 },
          content: '{{companyName}}',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#000000',
          textAlign: 'left',
        },
      ],
    },
    {
      type: 'detail',
      height: 30,
      dataBinding: 'items',
      components: [
        {
          type: 'text',
          position: { x: 0, y: 0, width: 200, height: 20 },
          content: '{{item.name}}',
          fontSize: 12,
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left',
        },
        {
          type: 'text',
          position: { x: 210, y: 0, width: 100, height: 20 },
          content: "{{formatCurrency(item.price, 'USD')}}",
          fontSize: 12,
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'right',
        },
      ],
    },
    {
      type: 'footer',
      height: 40,
      components: [
        {
          type: 'text',
          position: { x: 0, y: 0, width: 300, height: 20 },
          content: "Total: {{formatCurrency(sum(items, 'price'), 'USD')}}",
          fontSize: 12,
          fontWeight: 'bold',
          color: '#000000',
          textAlign: 'left',
        },
      ],
    },
  ],
}

const invoiceData = {
  companyName: 'Acme Corp',
  items: [
    { name: 'Laptop', price: 1200 },
    { name: 'Mouse', price: 25 },
  ],
}

describe('renderReport + renderToHtml (integration)', () => {
  it('full pipeline produces valid HTML document', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toMatch(/^<!DOCTYPE html>/i)
    expect(html).toContain('<html')
    expect(html).toContain('</html>')
  })

  it('HTML contains company name from data', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('Acme Corp')
  })

  it('HTML contains resolved item prices', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('$1,200.00')
    expect(html).toContain('$25.00')
  })

  it('HTML contains item names', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('Laptop')
    expect(html).toContain('Mouse')
  })

  it('HTML contains resolved total', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('Total: $1,225.00')
  })

  it('HTML contains exactly one page for this invoice', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    const pageCount = (html.match(/class="page"/g) ?? []).length
    expect(pageCount).toBe(1)
  })

  it('HTML contains A4 page dimensions', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('width:595pt')
    expect(html).toContain('height:842pt')
  })
})
