import { describe, it, expect } from 'vitest'
import { evaluateExpression } from '../../expression/evaluator.js'

describe('aggregate coercion', () => {
  it('sums numeric strings, as produced by database drivers serializing decimals', () => {
    const data = {
      rows: [
        { amount: '100.25', qty: 2 },
        { amount: '200.50', qty: '3' },
        { amount: 50, qty: null },
      ],
    }

    expect(evaluateExpression("{{sum(rows, 'amount')}}", data, 'en-US')).toBe(350.75)
    expect(evaluateExpression("{{sum(rows, 'qty')}}", data, 'en-US')).toBe(5)
  })

  it('treats non-numeric strings as zero rather than NaN-poisoning the total', () => {
    const data = { rows: [{ amount: 'abc' }, { amount: '10' }] }

    expect(evaluateExpression("{{sum(rows, 'amount')}}", data, 'en-US')).toBe(10)
  })
})
