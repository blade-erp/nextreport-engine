import { describe, it, expect } from 'vitest'
import { toNumber, toDate, toBoolean, toString } from '../../expression/coerce.js'

describe('toNumber', () => {
  it('passes a number through unchanged', () => {
    expect(toNumber(42)).toBe(42)
  })

  it('converts a numeric string to number', () => {
    expect(toNumber('100')).toBe(100)
  })

  it('converts a float string to number', () => {
    expect(toNumber('3.14')).toBeCloseTo(3.14)
  })

  it('returns 0 for null', () => {
    expect(toNumber(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(toNumber(undefined)).toBe(0)
  })

  it('throws on invalid string', () => {
    expect(() => toNumber('abc')).toThrow("Cannot coerce 'abc' to number")
  })

  it('throws on boolean', () => {
    expect(() => toNumber(true)).toThrow('Cannot coerce boolean to number')
  })
})

describe('toDate', () => {
  it('passes a Date through unchanged', () => {
    const d = new Date('2024-01-15')
    expect(toDate(d)).toBe(d)
  })

  it('parses an ISO date string', () => {
    const d = toDate('2024-01-15')
    expect(d).toBeInstanceOf(Date)
    expect(d.getFullYear()).toBe(2024)
  })

  it('throws on invalid date string', () => {
    expect(() => toDate('not-a-date')).toThrow()
  })

  it('throws on null', () => {
    expect(() => toDate(null)).toThrow()
  })
})

describe('toBoolean', () => {
  it('passes a boolean through unchanged', () => {
    expect(toBoolean(true)).toBe(true)
    expect(toBoolean(false)).toBe(false)
  })

  it("parses 'true' string", () => {
    expect(toBoolean('true')).toBe(true)
  })

  it("parses 'false' string", () => {
    expect(toBoolean('false')).toBe(false)
  })

  it('throws on unknown string', () => {
    expect(() => toBoolean('yes')).toThrow()
  })
})

describe('toString', () => {
  it('returns empty string for null', () => {
    expect(toString(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(toString(undefined)).toBe('')
  })

  it('converts number to string', () => {
    expect(toString(42)).toBe('42')
  })

  it('passes string through unchanged', () => {
    expect(toString('hello')).toBe('hello')
  })
})
