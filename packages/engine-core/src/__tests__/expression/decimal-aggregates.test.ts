import { describe, expect, it } from 'vitest'
import { evaluateExpression } from '../../expression/evaluator.js'

describe('decimal aggregates and math', () => {
  it.each([
    ['100000000000000.01', '0.01', '-100000000000000.01', '-0.01'],
    ['0.70', '0.10', '-0.70', '-0.10'],
  ])('cancels decimal rows exactly: %s, %s, %s, %s', (...values) => {
    const data = { rows: values.map((v) => ({ v })) }
    expect(evaluateExpression("{{formatNumber(sum(rows, 'v'), 2)}}", data)).toBe('0.00')
    expect(evaluateExpression("{{sum(rows, 'v')}}", data)).toBe(0)
    expect(evaluateExpression("{{if(sum(rows, 'v'), 'nonzero', 'zero')}}", data)).toBe('zero')
  })

  it('preserves cents in large sums and their formatted totals', () => {
    const data = { rows: [{ v: '100000000000000.01' }, { v: '0.02' }] }
    // The specified String(Number(s)) === s rule returns a number for this total.
    expect(evaluateExpression("{{sum(rows, 'v')}}", data)).toBe(100000000000000.03)
    expect(evaluateExpression("{{formatNumber(sum(rows, 'v'), 2)}}", data)).toBe(
      '100,000,000,000,000.03',
    )
    expect(evaluateExpression('{{sum(values)}}', { values: ['100000000000000.01', '0.03'] })).toBe(
      '100000000000000.04',
    )
  })

  it('combines number and string addends exactly', () => {
    const values = [0.7, '0.10', -0.7, '-0.10', '0x10', '2e-1']
    expect(evaluateExpression('{{sum(values)}}', { values })).toBe(16.2)
    expect(evaluateExpression("{{sum(rows, 'v')}}", { rows: values.map((v) => ({ v })) })).toBe(
      16.2,
    )
    expect(evaluateExpression('{{add(0.1, 0.2)}}', {})).toBe(0.3)
    expect(evaluateExpression("{{subtract('100000000000000.01', '100000000000000')}}", {})).toBe(
      0.01,
    )
    expect(evaluateExpression("{{multiply('100000000000000.01', '0.03')}}", {})).toBe(
      '3000000000000.0003',
    )
  })

  it('treats invalid addends as zero in aggregates and arithmetic', () => {
    const invalid = [
      null,
      undefined,
      '',
      ' ',
      'abc',
      true,
      false,
      {},
      [],
      1n,
      NaN,
      Infinity,
      -Infinity,
      'Infinity',
      '-Infinity',
    ]
    const data = { values: [...invalid, '0.1', 0.2] }
    expect(evaluateExpression('{{sum(values)}}', data)).toBe(0.3)
    expect(
      evaluateExpression("{{sum(rows, 'v')}}", {
        rows: data.values.map((v) => ({ v })),
      }),
    ).toBe(0.3)
    for (const value of invalid) {
      expect(evaluateExpression('{{add(value, 2)}}', { value })).toBe(2)
      expect(evaluateExpression('{{subtract(value, 2)}}', { value })).toBe(-2)
      expect(evaluateExpression('{{multiply(value, 2)}}', { value })).toBe(0)
      expect(evaluateExpression('{{divide(value, 2)}}', { value })).toBe(0)
      expect(evaluateExpression('{{divide(2, value)}}', { value })).toBe(0)
    }
  })

  it('averages exact totals using all rows in the denominator', () => {
    const values = ['100000000000000.01', '100000000000000.02']
    expect(evaluateExpression('{{avg(values)}}', { values })).toBe('100000000000000.015')
    expect(evaluateExpression("{{avg(rows, 'v')}}", { rows: values.map((v) => ({ v })) })).toBe(
      '100000000000000.015',
    )
    expect(evaluateExpression('{{avg(values)}}', { values: ['1', null, 'abc'] })).toBe(
      '0.33333333333333333333',
    )
    expect(evaluateExpression("{{avg(rows, 'v')}}", { rows: [{ v: '1' }, { v: null }, {}] })).toBe(
      '0.33333333333333333333',
    )
  })

  it('divides exact sums for ratios and guards a cancelling denominator', () => {
    expect(
      evaluateExpression("{{ratio(rows, 'n', 'd')}}", {
        rows: [
          { n: '100000000000000.01', d: '1' },
          { n: '100000000000000.02', d: '1' },
        ],
      }),
    ).toBe('100000000000000.015')
    expect(
      evaluateExpression("{{ratio(rows, 'n', 'd')}}", {
        rows: [{ n: '1', d: '3' }],
      }),
    ).toBe('0.33333333333333333333')
    expect(
      evaluateExpression("{{ratio(rows, 'n', 'd')}}", {
        rows: ['0.7', '0.1', '-0.7', '-0.1'].map((d) => ({ n: 1, d })),
      }),
    ).toBe(0)
  })

  it('rounds division to 20 places (20 significant digits for tiny quotients), simple quotients as numbers', () => {
    expect(evaluateExpression('{{divide(1, 3)}}', {})).toBe('0.33333333333333333333')
    expect(evaluateExpression('{{divide(2, 3)}}', {})).toBe('0.66666666666666666667')
    expect(evaluateExpression('{{divide(10, 4)}}', {})).toBe(2.5)
    expect(evaluateExpression('{{divide(x, 0)}}', { x: '100000000000000.01' })).toBe(0)
    expect(evaluateExpression("{{divide('-0.000000000000000000005', 1)}}", {})).toBe(
      '-0.000000000000000000005',
    )
    expect(evaluateExpression('{{divide(0, 1)}}', {})).toBe(0)
  })

  it.each([
    '{{sum(values)}}',
    "{{sum(values, 'v')}}",
    '{{avg(values)}}',
    "{{avg(values, 'v')}}",
    "{{ratio(values, 'n', 'd')}}",
  ])('returns zero for empty and non-array input to %s', (expression) => {
    for (const values of [[], null, undefined, 'abc', 1, {}]) {
      expect(evaluateExpression(expression, { values })).toBe(0)
    }
  })
})

describe('division precision for small quotients', () => {
  it.each(['3', '3000000000000000000', '1000000000000000000000', '7e40'])(
    'multiplying divide(1, %s) back up still prints 1.00',
    (d) => {
      expect(evaluateExpression('{{formatNumber(multiply(divide(1, d), d), 2)}}', { d })).toBe(
        '1.00',
      )
    },
  )

  it('keeps 20 significant digits for avg and ratio of tiny values', () => {
    const rows = [{ n: '1', d: '3000000000000000000' }]
    expect(
      evaluateExpression(
        "{{formatNumber(multiply(ratio(rows, 'n', 'd'), 3000000000000000000), 2)}}",
        {
          rows,
        },
      ),
    ).toBe('1.00')
    expect(evaluateExpression("{{avg(rows, 'v')}}", { rows: [{ v: '1e-30' }, { v: 0 }] })).toBe(
      '0.0000000000000000000000000000005',
    )
  })
})

describe('exact decimal formatters', () => {
  it.each([
    ['{{formatNumber(-0.001, 2)}}', '0.00'],
    ["{{formatCurrency('-0.004', 'USD')}}", '$0.00'],
    ["{{formatPercent('-0.0001', 1)}}", '0.0%'],
    ["{{formatNumber('-0.005', 2)}}", '-0.01'],
    ["{{formatCurrency('-0.005', 'USD')}}", '-$0.01'],
    ["{{formatPercent('-0.0005', 1)}}", '-0.1%'],
    ["{{formatNumber('100000000000000.015', 2)}}", '100,000,000,000,000.02'],
    ["{{formatCurrency('100000000000000.015', 'USD')}}", '$100,000,000,000,000.02'],
    ["{{formatPercent('1000000000000.00015', 2)}}", '100,000,000,000,000.02%'],
    ["{{formatNumber('1.005', '2')}}", '1.01'],
    ["{{formatNumber('1e-2', 2)}}", '0.01'],
  ])('formats %s as %s', (expression, expected) => {
    expect(evaluateExpression(expression, {})).toBe(expected)
  })

  it.each([
    ['{{formatNumber(value, 2)}}', '0.00'],
    ["{{formatCurrency(value, 'USD')}}", '$0.00'],
    ['{{formatPercent(value, 1)}}', '0.0%'],
  ])('formats null, missing values, and signed zero with %s', (expression, expected) => {
    for (const value of [null, undefined, -0, '-0.00']) {
      expect(evaluateExpression(expression, { value })).toBe(expected)
    }
  })

  it.each([
    ['{{formatNumber(value, 2)}}', {}, 'abc', true, 1n],
    ["{{formatCurrency(value, 'USD')}}", {}, 'abc', true, 1n],
    ['{{formatPercent(value, 1)}}', {}, 'abc', true, 1n],
  ])('keeps strict errors for invalid values in %s', (expression, ...values) => {
    for (const value of values) {
      expect(() => evaluateExpression(expression, { value })).toThrow('Cannot coerce')
    }
  })

  it.each([
    ['{{formatNumber(value, 2)}}', '0.00', '16.00', '∞', 'NaN'],
    ["{{formatCurrency(value, 'USD')}}", '$0.00', '$16.00', '$∞', '$NaN'],
    ['{{formatPercent(value, 1)}}', '0.0%', '1,600.0%', '∞%', 'NaN%'],
  ])('preserves fallback number formatting in %s', (expression, zero, hex, infinity, nan) => {
    expect(evaluateExpression(expression, { value: '' })).toBe(zero)
    expect(evaluateExpression(expression, { value: ' ' })).toBe(zero)
    expect(evaluateExpression(expression, { value: '0x10' })).toBe(hex)
    expect(evaluateExpression(expression, { value: 'Infinity' })).toBe(infinity)
    expect(evaluateExpression(expression, { value: NaN })).toBe(nan)
  })

  it('uses the requested locale for exact decimal formatting', () => {
    expect(
      evaluateExpression(
        '{{formatNumber(value, 2)}}',
        {
          value: '100000000000000.01',
        },
        'de-DE',
      ),
    ).toBe('100.000.000.000.000,01')
  })
})

describe('decimal comparisons', () => {
  it.each([
    ["'0.00' == 0", true],
    ["'0.00' != 0", false],
    ['value == 0', false],
    ["'' == 0", false],
    ["'abc' == 0", false],
    ["'0.00' == '0'", false],
    ["'10' > 9", true],
    ["'100000000000000.02' > 100000000000000", true],
    ["'100000000000000.01' < 100000000000000.02", true],
    ["100000000000000.02 > '100000000000000.01'", true],
    ["0 == '0.00'", true],
    ["0 != '0.00'", false],
    ["'1.00' >= 1", true],
    ["1 <= '1.00'", true],
    ["'1.01' <= 1", false],
    ["'0.99' >= 1", false],
    ["'10' < '9'", false],
    ["'10' > '9'", true],
    ['divide(100, 3) > divide(20, 3)', true],
    ['divide(20, 3) < divide(100, 3)', true],
    ['sum(big) > sum(small)', true],
    ["'2026-01-02' > '2026-01-01'", true],
    ["'b' > 'a'", true],
    ["'0x10' == 16", false],
    ["'0x10' > 15", true],
    ['value < 1', true],
    ["formatNumber(1, 2) == formatNumber('1.00', 2)", true],
    ['divide(1, 3) > 0.3333333333333333', true],
  ])('evaluates %s as %s', (expression, expected) => {
    const big = [{ v: '100000000000000.01' }, { v: '0.02' }, { v: '0.001' }]
    const small = [{ v: '9.5' }]
    expect(
      evaluateExpression(`{{${expression}}}`, {
        value: null,
        big: big.map((r) => r.v),
        small: small.map((r) => r.v),
      }),
    ).toBe(expected)
  })

  it.each([null, undefined, '', 'abc', true, false, NaN, Infinity])(
    'preserves strict equality with zero for %s',
    (value) => {
      expect(evaluateExpression('{{value == 0}}', { value })).toBe(false)
      expect(evaluateExpression('{{value != 0}}', { value })).toBe(true)
    },
  )

  it.each([
    ['0.00', 'zero'],
    [0, 'zero'],
    [null, 'other'],
  ])('branches on row.x == 0 for %s', (x, expected) => {
    expect(evaluateExpression("{{if(row.x == 0, 'zero', 'other')}}", { row: { x } })).toBe(expected)
  })
})
