import { describe, it, expect } from 'vitest'
import { evaluateExpression } from '../../expression/evaluator.js'

const data = {
  rows: [
    { revenue: '100.00', qty: 2 },
    { revenue: '300.00', qty: 4 },
  ],
  parentRows: [
    { revenue: '100.00', qty: 2 },
    { revenue: '300.00', qty: 4 },
    { revenue: '600.00', qty: 6 },
  ],
  price: '12.50',
}

describe('arithmetic expressions', () => {
  it('supports the four operators with precedence', () => {
    expect(evaluateExpression('{{2 + 3 * 4}}', data, 'en-US')).toBe(14)
    expect(evaluateExpression('{{(2 + 3) * 4}}', data, 'en-US')).toBe(20)
    expect(evaluateExpression('{{10 - 4 / 2}}', data, 'en-US')).toBe(8)
  })

  it('supports unary minus', () => {
    expect(evaluateExpression('{{-5 + 3}}', data, 'en-US')).toBe(-2)
  })

  it('divides aggregates across different scopes — the share-of-parent pattern', () => {
    expect(
      evaluateExpression("{{sum(rows, 'revenue') / sum(parentRows, 'revenue')}}", data, 'en-US'),
    ).toBe(0.4)
    expect(
      evaluateExpression(
        "{{formatPercent(sum(rows, 'revenue') / sum(parentRows, 'revenue'), 1)}}",
        data,
        'en-US',
      ),
    ).toBe('40.0%')
  })

  it('computes weighted averages as ratio-of-sums', () => {
    expect(
      evaluateExpression("{{sum(rows, 'revenue') / sum(rows, 'qty')}}", data, 'en-US'),
    ).toBeCloseTo(66.666, 2)
  })

  it('coerces numeric strings and treats division by zero as 0', () => {
    expect(evaluateExpression('{{price * 2}}', data, 'en-US')).toBe(25)
    expect(evaluateExpression('{{5 / 0}}', data, 'en-US')).toBe(0)
  })

  it('keeps comparisons working around arithmetic', () => {
    expect(evaluateExpression('{{2 + 2 == 4}}', data, 'en-US')).toBe(true)
    expect(evaluateExpression("{{if(1 + 1 > 1, 'yes', 'no')}}", data, 'en-US')).toBe('yes')
  })
})
