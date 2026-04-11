import { describe, it, expect } from 'vitest'
import { renderReport, validateReport } from '../../pipeline/render-pipeline.js'
import type { Report } from '@nextreport/schema'

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

describe('renderReport (integration)', () => {
  it('renders a full invoice with correct element count and resolved values', () => {
    const result = renderReport(invoiceSchema, invoiceData)

    // 1 page expected
    expect(result.pages).toHaveLength(1)

    // 6 elements: 1 header + 2×2 detail + 1 footer
    expect(result.pages[0].elements).toHaveLength(6)

    const contents = result.pages[0].elements.map((e) => e.properties.content)
    expect(contents).toContain('Acme Corp')
    expect(contents).toContain('Laptop')
    expect(contents).toContain('$1,200.00')
    expect(contents).toContain('Mouse')
    expect(contents).toContain('$25.00')
    expect(contents).toContain('Total: $1,225.00')
  })

  it('places elements with correct absolute positions using margins', () => {
    const result = renderReport(invoiceSchema, invoiceData)
    const elements = result.pages[0].elements

    // Header element: x=15+0=15, y=20+0+0=20
    const headerEl = elements.find((e) => e.bandType === 'header')
    expect(headerEl).toBeDefined()
    expect(headerEl!.position.x).toBe(15) // marginLeft(15) + x(0)
    expect(headerEl!.position.y).toBe(20) // marginTop(20) + currentY(0) + y(0)
  })

  it('returns correct metadata', () => {
    const result = renderReport(invoiceSchema, invoiceData)

    expect(result.metadata.totalPages).toBe(1)
    expect(result.metadata.locale).toBe('en-US')
    expect(result.metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('validates a correct schema as valid', () => {
    const validation = validateReport(invoiceSchema)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('validates an invalid schema and returns errors', () => {
    const invalidSchema = {
      type: 'report',
      bands: 'not-an-array', // wrong type
    }
    const validation = validateReport(invalidSchema)
    expect(validation.valid).toBe(false)
    expect(validation.errors.length).toBeGreaterThan(0)
  })
})
