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

  it('processes group-header/detail/group-footer sequence with groupBy', () => {
    const groupData = {
      employees: [
        { name: 'Alice', department: 'Engineering', salary: 80000 },
        { name: 'Bob', department: 'Engineering', salary: 90000 },
        { name: 'Carol', department: 'Marketing', salary: 70000 },
      ],
    }

    const bands: Band[] = [
      {
        type: 'group-header',
        height: 30,
        dataBinding: 'employees',
        groupBy: 'department',
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{_groupKey}}',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
      {
        type: 'detail',
        height: 25,
        dataBinding: 'employees',
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{employee.name}}',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
      {
        type: 'group-footer',
        height: 25,
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: "Subtotal: {{sum(_groupItems, 'salary')}}",
            fontSize: 12,
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
    ]

    const result = processBands(bands, groupData, 'en-US')

    // Engineering: header + 2 detail + footer = 4
    // Marketing: header + 1 detail + footer = 3
    // Total: 7
    expect(result).toHaveLength(7)

    // Engineering group
    expect(result[0].bandType).toBe('group-header')
    expect(result[0].elements[0].properties.content).toBe('Engineering')
    expect(result[1].bandType).toBe('detail')
    expect(result[1].elements[0].properties.content).toBe('Alice')
    expect(result[2].bandType).toBe('detail')
    expect(result[2].elements[0].properties.content).toBe('Bob')
    expect(result[3].bandType).toBe('group-footer')
    expect(result[3].elements[0].properties.content).toBe('Subtotal: 170000')

    // Marketing group
    expect(result[4].bandType).toBe('group-header')
    expect(result[4].elements[0].properties.content).toBe('Marketing')
    expect(result[5].bandType).toBe('detail')
    expect(result[5].elements[0].properties.content).toBe('Carol')
    expect(result[6].bandType).toBe('group-footer')
    expect(result[6].elements[0].properties.content).toBe('Subtotal: 70000')
  })

  it('handles group-header without group-footer', () => {
    const groupData = {
      employees: [
        { name: 'Alice', department: 'Engineering' },
        { name: 'Bob', department: 'Marketing' },
      ],
    }

    const bands: Band[] = [
      {
        type: 'group-header',
        height: 30,
        dataBinding: 'employees',
        groupBy: 'department',
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{_groupKey}}',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
      {
        type: 'detail',
        height: 25,
        dataBinding: 'employees',
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{employee.name}}',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
    ]

    const result = processBands(bands, groupData, 'en-US')

    // Engineering: header + 1 detail = 2
    // Marketing: header + 1 detail = 2
    expect(result).toHaveLength(4)
    expect(result[0].bandType).toBe('group-header')
    expect(result[1].bandType).toBe('detail')
    expect(result[2].bandType).toBe('group-header')
    expect(result[3].bandType).toBe('detail')
  })

  it('provides _groupIndex in group context', () => {
    const groupData = {
      items: [
        { name: 'A', category: 'X' },
        { name: 'B', category: 'Y' },
      ],
    }

    const bands: Band[] = [
      {
        type: 'group-header',
        height: 30,
        dataBinding: 'items',
        groupBy: 'category',
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 200, height: 20 },
            content: '{{_groupIndex}}',
            fontSize: 12,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
      {
        type: 'detail',
        height: 25,
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
        type: 'group-footer',
        height: 20,
        components: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 100, height: 20 },
            content: '-',
            fontSize: 10,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
    ]

    const result = processBands(bands, groupData, 'en-US')

    // Group X: header(index=0) + detail + footer = 3
    // Group Y: header(index=1) + detail + footer = 3
    expect(result[0].elements[0].properties.content).toBe(0)
    expect(result[3].elements[0].properties.content).toBe(1)
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
