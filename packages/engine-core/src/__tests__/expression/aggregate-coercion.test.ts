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

  it('sums a bare array of numeric strings', () => {
    expect(evaluateExpression('{{sum(values)}}', { values: ['1.5', '2.5', 3] }, 'en-US')).toBe(7)
  })

  it('handles negative and exponent-notation strings', () => {
    const data = { rows: [{ n: '-10.5' }, { n: '1e2' }] }
    expect(evaluateExpression("{{sum(rows, 'n')}}", data, 'en-US')).toBe(89.5)
  })
})

// Values that were already summed correctly before numeric-string coercion was
// added. These pin the pre-existing contract: only strings changed meaning.
describe('aggregate back-compat', () => {
  it('sums plain numbers unchanged', () => {
    const data = { rows: [{ n: 10 }, { n: 20.5 }, { n: -3 }] }
    expect(evaluateExpression("{{sum(rows, 'n')}}", data, 'en-US')).toBe(27.5)
  })

  it('still treats null, undefined, booleans and objects as zero', () => {
    const data = {
      rows: [{ n: null }, { n: undefined }, { n: true }, { n: {} }, { n: [] }, { n: 5 }],
    }
    expect(evaluateExpression("{{sum(rows, 'n')}}", data, 'en-US')).toBe(5)
  })

  it('still treats empty and whitespace-only strings as zero', () => {
    const data = { rows: [{ n: '' }, { n: '   ' }, { n: 7 }] }
    expect(evaluateExpression("{{sum(rows, 'n')}}", data, 'en-US')).toBe(7)
  })

  it('still returns 0 for a missing field and for a non-array argument', () => {
    expect(evaluateExpression("{{sum(rows, 'nope')}}", { rows: [{ n: 1 }] }, 'en-US')).toBe(0)
    expect(evaluateExpression("{{sum(notAnArray, 'n')}}", { notAnArray: 42 }, 'en-US')).toBe(0)
  })

  it('still returns 0 for an empty array', () => {
    expect(evaluateExpression("{{sum(rows, 'n')}}", { rows: [] }, 'en-US')).toBe(0)
  })

  it('leaves count() untouched, including for non-numeric rows', () => {
    const data = { rows: [{ n: 'abc' }, { n: null }, { n: 3 }] }
    expect(evaluateExpression('{{count(rows)}}', data, 'en-US')).toBe(3)
    expect(evaluateExpression('{{count(nope)}}', data, 'en-US')).toBe(0)
  })

  // Deliberate change: upstream passed NaN/Infinity straight through (typeof is
  // 'number'), so a single bad row poisoned the whole total. They now count as 0,
  // matching how non-numeric strings are already treated.
  it('neutralises NaN and Infinity instead of propagating them', () => {
    const data = { rows: [{ n: NaN }, { n: Infinity }, { n: 5 }] }
    expect(evaluateExpression("{{sum(rows, 'n')}}", data, 'en-US')).toBe(5)
  })
})
