import { describe, it, expect } from 'vitest'
import { processBands } from '../band-processor/band-processor.js'
import type { Band } from '@nextreport/schema'

const text = (content: string, bold = false) => ({
  type: 'text' as const,
  position: { x: 0, y: 0, width: 200, height: 20 },
  content,
  fontSize: 12,
  fontWeight: bold ? ('bold' as const) : ('normal' as const),
  color: '#000000',
  textAlign: 'left' as const,
})

const orderData = {
  orders: [
    { region: 'East', customer: 'Acme', part: 'P-1', amount: 100 },
    { region: 'East', customer: 'Acme', part: 'P-2', amount: 200 },
    { region: 'East', customer: 'Blade', part: 'P-1', amount: 50 },
    { region: 'West', customer: 'Cascade', part: 'P-3', amount: 400 },
  ],
}

function nestedBands(): Band[] {
  return [
    {
      type: 'group-header',
      height: 30,
      dataBinding: 'orders',
      groupBy: 'region',
      components: [text('Region: {{_groupKey}}', true)],
    },
    {
      type: 'group-header',
      height: 25,
      groupBy: 'customer',
      components: [text('Customer: {{_groupKey}} (in {{_parentGroupKey}})', true)],
    },
    {
      type: 'detail',
      height: 20,
      dataBinding: 'orders',
      components: [text('{{order.part}}: {{order.amount}}')],
    },
    {
      type: 'group-footer',
      height: 20,
      components: [text("Customer total: {{sum(_groupItems, 'amount')}}")],
    },
    {
      type: 'group-footer',
      height: 25,
      components: [text("Region total: {{sum(_groupItems, 'amount')}}")],
    },
  ]
}

describe('nested group sequences', () => {
  it('partitions inner groups within each outer group', () => {
    const result = processBands(nestedBands(), orderData, 'en-US')

    const contents = result.map((band) => String(band.elements[0]?.properties.content))

    expect(contents).toEqual([
      'Region: East',
      'Customer: Acme (in East)',
      'P-1: 100',
      'P-2: 200',
      'Customer total: 300',
      'Customer: Blade (in East)',
      'P-1: 50',
      'Customer total: 50',
      'Region total: 350',
      'Region: West',
      'Customer: Cascade (in West)',
      'P-3: 400',
      'Customer total: 400',
      'Region total: 400',
    ])
  })

  it('matches each group-footer to its own group-header by nesting depth', () => {
    const result = processBands(nestedBands(), orderData, 'en-US')

    const bandTypes = result.map((band) => band.bandType)

    expect(bandTypes).toEqual([
      'group-header', // East
      'group-header', // Acme
      'detail',
      'detail',
      'group-footer', // Acme
      'group-header', // Blade
      'detail',
      'group-footer', // Blade
      'group-footer', // East
      'group-header', // West
      'group-header', // Cascade
      'detail',
      'group-footer', // Cascade
      'group-footer', // West
    ])
  })

  it('supports three levels of nesting', () => {
    const bands: Band[] = [
      {
        type: 'group-header',
        height: 30,
        dataBinding: 'orders',
        groupBy: 'region',
        components: [text('R:{{_groupKey}}')],
      },
      {
        type: 'group-header',
        height: 25,
        groupBy: 'customer',
        components: [text('C:{{_groupKey}}')],
      },
      {
        type: 'group-header',
        height: 20,
        groupBy: 'part',
        components: [text('P:{{_groupKey}}')],
      },
      {
        type: 'detail',
        height: 15,
        dataBinding: 'orders',
        components: [text('{{order.amount}}')],
      },
      { type: 'group-footer', height: 15, components: [text('p-total')] },
      { type: 'group-footer', height: 20, components: [text('c-total')] },
      { type: 'group-footer', height: 25, components: [text('r-total')] },
    ]

    const result = processBands(bands, orderData, 'en-US')
    const contents = result.map((band) => String(band.elements[0]?.properties.content))

    expect(contents).toEqual([
      'R:East',
      'C:Acme',
      'P:P-1',
      '100',
      'p-total',
      'P:P-2',
      '200',
      'p-total',
      'c-total',
      'C:Blade',
      'P:P-1',
      '50',
      'p-total',
      'c-total',
      'r-total',
      'R:West',
      'C:Cascade',
      'P:P-3',
      '400',
      'p-total',
      'c-total',
      'r-total',
    ])
  })

  it('single-level grouping behaves exactly as before', () => {
    const bands: Band[] = [
      {
        type: 'group-header',
        height: 30,
        dataBinding: 'orders',
        groupBy: 'region',
        components: [text('{{_groupKey}}')],
      },
      {
        type: 'detail',
        height: 20,
        dataBinding: 'orders',
        components: [text('{{order.part}}')],
      },
      {
        type: 'group-footer',
        height: 20,
        components: [text("{{sum(_groupItems, 'amount')}}")],
      },
    ]

    const result = processBands(bands, orderData, 'en-US')
    const contents = result.map((band) => String(band.elements[0]?.properties.content))

    expect(contents).toEqual(['East', 'P-1', 'P-2', 'P-1', '350', 'West', 'P-3', '400'])
  })
})
