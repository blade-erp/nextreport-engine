import { describe, expect, it } from 'vitest'
import type { Decimal } from '../../expression/decimal.js'
import {
  ZERO,
  add,
  sub,
  mul,
  div,
  cmp,
  isZero,
  parseDecimal,
  toDecimalLenient,
  toCanonicalString,
  toResult,
} from '../../expression/decimal.js'

function decimal(value: unknown): Decimal {
  const parsed = parseDecimal(value)
  if (parsed === null) throw new Error(`Invalid test decimal: ${String(value)}`)
  return parsed
}

describe('parseDecimal', () => {
  it.each([
    [0, '0'],
    [-0, '0'],
    ['-0.00', '0'],
    ['  100.50\n', '100.5'],
    ['.5', '0.5'],
    ['5.', '5'],
    ['+5', '5'],
    ['0005.0100', '5.01'],
    ['-.5', '-0.5'],
    ['1e+3', '1000'],
    ['-1.25E-2', '-0.0125'],
    ['5.e1', '50'],
    [1e21, '1000000000000000000000'],
    [5e-7, '0.0000005'],
  ])('parses %s exactly', (value, expected) => {
    expect(toCanonicalString(decimal(value))).toBe(expected)
  })

  it.each([
    null,
    undefined,
    '',
    '   ',
    true,
    false,
    {},
    [],
    1n,
    NaN,
    Infinity,
    -Infinity,
    'Infinity',
    'NaN',
    'abc',
    '0x10',
    '1,000',
    '.',
    '+',
    '1e',
    '1e+',
    '1.2.3',
    '1 2',
    '--1',
    '1e401',
    '1e-401',
    '1e999999',
    '1e-999999',
    '0e401',
  ])('rejects %s', (value) => {
    expect(parseDecimal(value)).toBeNull()
  })

  it('accepts exponents at both boundaries', () => {
    expect(toCanonicalString(decimal('1e400'))).toBe(`1${'0'.repeat(400)}`)
    expect(toCanonicalString(decimal('1e-400'))).toBe(`0.${'0'.repeat(399)}1`)
    expect(toCanonicalString(decimal('1e+000400'))).toBe(`1${'0'.repeat(400)}`)
  })
})

describe('toDecimalLenient', () => {
  it('preserves exact decimals and accepts finite non-decimal numeric strings', () => {
    expect(toCanonicalString(toDecimalLenient('100000000000000.01'))).toBe('100000000000000.01')
    expect(toCanonicalString(toDecimalLenient(' 0x10 '))).toBe('16')
    expect(toCanonicalString(toDecimalLenient('0b11'))).toBe('3')
    expect(toCanonicalString(toDecimalLenient('0o10'))).toBe('8')
    expect(toCanonicalString(toDecimalLenient('1e-401'))).toBe('0')
  })

  it.each([
    null,
    undefined,
    '',
    ' ',
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
    'NaN',
    'abc',
    '1e999999',
  ])('coerces %s to zero', (value) => {
    expect(toDecimalLenient(value)).toEqual(ZERO)
  })
})

describe('decimal arithmetic', () => {
  it('adds and subtracts across scales without cancellation errors', () => {
    expect(toCanonicalString(add(decimal('0.7'), decimal('0.1')))).toBe('0.8')
    const large = add(decimal('100000000000000.01'), decimal('0.02'))
    expect(toCanonicalString(large)).toBe('100000000000000.03')
    expect(toCanonicalString(sub(large, decimal('100000000000000.01')))).toBe('0.02')
    expect(toCanonicalString(sub(decimal('1'), decimal('1.0001')))).toBe('-0.0001')
    expect(isZero(add(decimal('-0.7'), decimal('0.70')))).toBe(true)
  })

  it('multiplies coefficients and scales exactly', () => {
    expect(toCanonicalString(mul(decimal('0.7'), decimal('0.1')))).toBe('0.07')
    expect(toCanonicalString(mul(decimal('-100000000000000.01'), decimal('0.03')))).toBe(
      '-3000000000000.0003',
    )
    expect(isZero(mul(ZERO, decimal('123.45')))).toBe(true)
  })

  it.each([
    ['1', '3', 20, '0.33333333333333333333'],
    ['2', '3', 20, '0.66666666666666666667'],
    ['10', '4', 20, '2.5'],
    ['2.5', '1', 0, '3'],
    ['-2.5', '1', 0, '-3'],
    ['2.5', '-1', 0, '-3'],
    ['-2.5', '-1', 0, '3'],
    ['1', '8', 2, '0.13'],
    ['-1', '8', 2, '-0.13'],
    ['1.249', '1', 2, '1.25'],
    ['1.244', '1', 2, '1.24'],
    ['9.995', '1', 2, '10'],
    ['0.001', '2', 2, '0'],
    ['-0.001', '2', 2, '0'],
    ['0.001', '0.02', 4, '0.05'],
    ['1', '0.0002', 2, '5000'],
    ['0', '-2', 20, '0'],
  ])('divides %s by %s at scale %s', (a, b, scale, expected) => {
    expect(toCanonicalString(div(decimal(a), decimal(b), scale))).toBe(expected)
  })

  it('defaults division to 20 decimal places', () => {
    expect(toCanonicalString(div(decimal('1'), decimal('6')))).toBe('0.16666666666666666667')
  })

  it.each([
    ['0.00', '0', 0],
    ['1.000', '1', 0],
    ['100000000000000.02', '100000000000000.01', 1],
    ['-100000000000000.02', '-100000000000000.01', -1],
    ['0.1', '1', -1],
    ['-0.1', '-1', 1],
  ])('compares %s with %s', (a, b, expected) => {
    expect(cmp(decimal(a), decimal(b))).toBe(expected)
  })

  it('recognizes zero at any scale', () => {
    expect(isZero({ coef: 0n, scale: 20 })).toBe(true)
    expect(isZero(decimal('0.0001'))).toBe(false)
  })
})

describe('decimal output', () => {
  it.each([
    [{ coef: 10050n, scale: 2 }, '100.5'],
    [{ coef: -10000n, scale: 2 }, '-100'],
    [{ coef: 100n, scale: 0 }, '100'],
    [{ coef: 1n, scale: 5 }, '0.00001'],
    [{ coef: 0n, scale: 20 }, '0'],
  ])('canonicalizes %o', (value, expected) => {
    expect(toCanonicalString(value)).toBe(expected)
  })

  it.each([
    ['350.750', 350.75],
    ['0.1', 0.1],
    ['2.5', 2.5],
    ['-0.00', 0],
    ['100000000000000.03', 100000000000000.03],
    ['100000000000000.01', '100000000000000.01'],
    ['0.33333333333333333333', '0.33333333333333333333'],
    ['9007199254740993', '9007199254740993'],
    ['1e21', '1000000000000000000000'],
    ['5e-7', '0.0000005'],
  ])('returns a faithful number or exact string for %s', (value, expected) => {
    expect(toResult(decimal(value))).toBe(expected)
  })
})
