import { describe, it, expect } from 'vitest'
import { evaluateExpression } from '../../expression/evaluator.js'

const data = {
  groupItems: [{ revenue: 100 }, { revenue: 300 }],
  parentItems: [{ revenue: 100 }, { revenue: 300 }, { revenue: 600 }],
  rows: [
    { revenue: 100, qty: 2 },
    { revenue: 300, qty: 4 },
  ],
  emptyGroup: [],
  price: '12.50',
  qty: 3,
  label: 'N/A',
}

describe('math functions', () => {
  it('adds and subtracts', () => {
    expect(evaluateExpression('{{add(2, 3)}}', data, 'en-US')).toBe(5)
    expect(evaluateExpression('{{subtract(10, 4)}}', data, 'en-US')).toBe(6)
  })

  it('multiplies and divides', () => {
    expect(evaluateExpression('{{multiply(6, 7)}}', data, 'en-US')).toBe(42)
    expect(evaluateExpression('{{divide(10, 4)}}', data, 'en-US')).toBe(2.5)
  })

  it('divides aggregates across different scopes — the share-of-parent pattern', () => {
    expect(
      evaluateExpression(
        "{{divide(sum(groupItems, 'revenue'), sum(parentItems, 'revenue'))}}",
        data,
        'en-US',
      ),
    ).toBe(0.4)
  })

  it('computes a weighted average as a ratio of sums', () => {
    expect(
      evaluateExpression("{{divide(sum(rows, 'revenue'), sum(rows, 'qty'))}}", data, 'en-US'),
    ).toBeCloseTo(66.666, 2)
  })

  it('treats division by zero as 0 so an empty group does not render NaN', () => {
    expect(evaluateExpression('{{divide(10, 0)}}', data, 'en-US')).toBe(0)
    expect(
      evaluateExpression("{{divide(sum(rows, 'revenue'), sum(emptyGroup, 'qty'))}}", data, 'en-US'),
    ).toBe(0)
  })

  it('coerces numeric strings, as produced by database drivers', () => {
    expect(evaluateExpression('{{multiply(price, 2)}}', data, 'en-US')).toBe(25)
    expect(evaluateExpression('{{add(price, qty)}}', data, 'en-US')).toBe(15.5)
  })

  it('treats non-numeric values as 0 rather than failing the whole report', () => {
    expect(evaluateExpression('{{add(label, 5)}}', data, 'en-US')).toBe(5)
    expect(evaluateExpression('{{multiply(missing, 5)}}', data, 'en-US')).toBe(0)
  })

  it('nests with the formatters', () => {
    expect(
      evaluateExpression(
        "{{formatNumber(divide(sum(groupItems, 'revenue'), sum(parentItems, 'revenue')), 2)}}",
        data,
        'en-US',
      ),
    ).toBe('0.40')
  })

  it('composes with itself for multi-step arithmetic', () => {
    // (2 + 3) * 4
    expect(evaluateExpression('{{multiply(add(2, 3), 4)}}', data, 'en-US')).toBe(20)
    // 10 - (4 / 2)
    expect(evaluateExpression('{{subtract(10, divide(4, 2))}}', data, 'en-US')).toBe(8)
  })

  it('works inside a comparison', () => {
    expect(evaluateExpression('{{if(add(1, 1) > 1, "yes", "no")}}', data, 'en-US')).toBe('yes')
  })
})
