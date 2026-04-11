import { describe, it, expect } from 'vitest'
import { renderReport } from '@nextreport/engine-core'
import { renderToHtml } from '../index.js'

// Realistic invoice schema with header, detail, footer using tr-TR locale
const invoiceSchema = {
  version: '1.0',
  type: 'report' as const,
  locale: 'tr-TR',
  page: {
    size: 'A4' as const,
    orientation: 'portrait' as const,
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
  },
  dataSource: { type: 'json' as const },
  bands: [
    {
      type: 'header' as const,
      height: 80,
      components: [
        {
          type: 'text' as const,
          position: { x: 0, y: 10, width: 300, height: 30 },
          content: '{{companyName}}',
          fontSize: 24,
          fontWeight: 'bold' as const,
          color: '#000000',
          textAlign: 'left' as const,
        },
      ],
    },
    {
      type: 'detail' as const,
      height: 25,
      dataBinding: 'items',
      components: [
        {
          type: 'text' as const,
          position: { x: 0, y: 0, width: 200, height: 25 },
          content: '{{item.name}}',
          fontSize: 12,
          fontWeight: 'normal' as const,
          color: '#000000',
          textAlign: 'left' as const,
        },
        {
          type: 'text' as const,
          position: { x: 400, y: 0, width: 100, height: 25 },
          content: "{{formatCurrency(item.price, 'TRY')}}",
          fontSize: 12,
          fontWeight: 'normal' as const,
          color: '#000000',
          textAlign: 'right' as const,
        },
      ],
    },
    {
      type: 'footer' as const,
      height: 40,
      components: [
        {
          type: 'text' as const,
          position: { x: 400, y: 5, width: 135, height: 30 },
          content: "Toplam: {{formatCurrency(sum(items, 'price'), 'TRY')}}",
          fontSize: 12,
          fontWeight: 'bold' as const,
          color: '#000000',
          textAlign: 'right' as const,
        },
      ],
    },
  ],
}

const invoiceData = {
  companyName: 'Acme Teknoloji A.Ş.',
  items: [
    { name: 'Laptop', price: 45000, qty: 1 },
    { name: 'Mouse', price: 750, qty: 3 },
    { name: 'Klavye', price: 1200, qty: 2 },
  ],
}

describe('Full pipeline: schema → engine-core → renderer-html', () => {
  it('full pipeline: schema → engine → HTML', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(typeof html).toBe('string')
    expect(html).toMatch(/^<!DOCTYPE html>/i)
  })

  it('HTML contains resolved header values', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('Acme Teknoloji')
  })

  it('HTML contains resolved detail values', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('Laptop')
    expect(html).toContain('Mouse')
    expect(html).toContain('Klavye')
  })

  it('HTML contains formatted currency', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    // tr-TR locale formats TRY with ₺ symbol
    expect(html).toContain('₺')
  })

  it('HTML contains footer total', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    // Footer should contain 'Toplam:' and the formatted sum (45000+750+1200 = 46950)
    expect(html).toContain('Toplam:')
    // The sum formatted in tr-TR locale: ₺46.950,00
    expect(html).toContain('₺46.950,00')
  })

  it('HTML has page structure', () => {
    const renderResult = renderReport(invoiceSchema, invoiceData)
    const html = renderToHtml(renderResult)

    expect(html).toContain('class="page"')
    expect(html).toContain('data-page="1"')
  })

  it('multi-page test: 40 items produces at least 2 pages', () => {
    const manyItems = Array.from({ length: 40 }, (_, i) => ({
      name: `Ürün ${i + 1}`,
      price: 100 * (i + 1),
      qty: 1,
    }))

    const renderResult = renderReport(invoiceSchema, { ...invoiceData, items: manyItems })
    const html = renderToHtml(renderResult)

    expect(html).toContain('data-page="2"')
  })
})
