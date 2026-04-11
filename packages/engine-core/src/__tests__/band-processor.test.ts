import { describe, it, expect } from 'vitest'
import { processBands } from '../band-processor/band-processor.js'
import type { Band } from '@nextreport/schema'

const sampleData = {
  companyName: 'Acme Corp',
  items: [
    { name: 'Laptop', price: 44000, qty: 1 },
    { name: 'Mouse', price: 1000, qty: 3 },
  ],
}

describe('processBands', () => {
  it('resolves expressions in a header band (single instance)', () => {
    const bands: Band[] = [
      {
        type: 'header',
        height: 80,
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{companyName}}',
            fontSize: 14,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
    ]

    const result = processBands(bands, sampleData, 'en-US')

    expect(result).toHaveLength(1)
    expect(result[0].bandType).toBe('header')
    expect(result[0].height).toBe(80)
    expect(result[0].elements).toHaveLength(1)
    expect(result[0].elements[0].properties.content).toBe('Acme Corp')
  })

  it('creates one ProcessedBand per item for a detail band with dataBinding', () => {
    const bands: Band[] = [
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
        ],
      },
    ]

    const result = processBands(bands, sampleData, 'en-US')

    expect(result).toHaveLength(2)
    expect(result[0].elements[0].properties.content).toBe('Laptop')
    expect(result[1].elements[0].properties.content).toBe('Mouse')
  })

  it('uses custom iteratorName when provided', () => {
    const bands: Band[] = [
      {
        type: 'detail',
        height: 30,
        dataBinding: 'items',
        iteratorName: 'product',
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{product.name}}',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
    ]

    const result = processBands(bands, sampleData, 'en-US')

    expect(result).toHaveLength(2)
    expect(result[0].elements[0].properties.content).toBe('Laptop')
    expect(result[1].elements[0].properties.content).toBe('Mouse')
  })

  it('resolves aggregate expression in footer band', () => {
    const bands: Band[] = [
      {
        type: 'footer',
        height: 40,
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: "Total: {{sum(items, 'price')}}",
            fontSize: 12,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
    ]

    const result = processBands(bands, sampleData, 'en-US')

    expect(result).toHaveLength(1)
    expect(result[0].elements[0].properties.content).toBe('Total: 45000')
  })

  it('returns mixed bands in order: header + 2 detail + footer = 4 ProcessedBands', () => {
    const bands: Band[] = [
      {
        type: 'header',
        height: 80,
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{companyName}}',
            fontSize: 14,
            fontWeight: 'normal',
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
        ],
      },
      {
        type: 'footer',
        height: 40,
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: "Total: {{sum(items, 'price')}}",
            fontSize: 12,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
    ]

    const result = processBands(bands, sampleData, 'en-US')

    expect(result).toHaveLength(4)
    expect(result[0].bandType).toBe('header')
    expect(result[1].bandType).toBe('detail')
    expect(result[2].bandType).toBe('detail')
    expect(result[3].bandType).toBe('footer')
  })
})
