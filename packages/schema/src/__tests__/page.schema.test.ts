import { describe, it, expect } from 'vitest'
import { PositionSchema, PageSchema, DataSourceSchema } from '../index.js'

describe('PositionSchema', () => {
  it('should accept valid position', () => {
    const result = PositionSchema.safeParse({ x: 10, y: 20, width: 100, height: 50 })
    expect(result.success).toBe(true)
  })

  it('should reject negative width', () => {
    const result = PositionSchema.safeParse({ x: 0, y: 0, width: -1, height: 50 })
    expect(result.success).toBe(false)
  })

  it('should reject zero height', () => {
    const result = PositionSchema.safeParse({ x: 0, y: 0, width: 100, height: 0 })
    expect(result.success).toBe(false)
  })

  it('should reject missing fields', () => {
    const result = PositionSchema.safeParse({ x: 0, y: 0 })
    expect(result.success).toBe(false)
  })
})

describe('PageSchema', () => {
  it('should accept a valid page config', () => {
    const result = PageSchema.safeParse({
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
    })
    expect(result.success).toBe(true)
  })

  it('should apply defaults (A4, portrait, margins 20/15/20/15)', () => {
    const result = PageSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.size).toBe('A4')
      expect(result.data.orientation).toBe('portrait')
      expect(result.data.margins.top).toBe(20)
      expect(result.data.margins.right).toBe(15)
      expect(result.data.margins.bottom).toBe(20)
      expect(result.data.margins.left).toBe(15)
    }
  })

  it('should accept A3 size', () => {
    const result = PageSchema.safeParse({ size: 'A3' })
    expect(result.success).toBe(true)
  })

  it('should accept landscape orientation', () => {
    const result = PageSchema.safeParse({ orientation: 'landscape' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid size', () => {
    const result = PageSchema.safeParse({ size: 'A5' })
    expect(result.success).toBe(false)
  })

  it('should reject negative margins', () => {
    const result = PageSchema.safeParse({
      margins: { top: -1, right: 0, bottom: 0, left: 0 },
    })
    expect(result.success).toBe(false)
  })
})

describe('DataSourceSchema', () => {
  it('should accept a valid datasource without fields', () => {
    const result = DataSourceSchema.safeParse({ type: 'json' })
    expect(result.success).toBe(true)
  })

  it('should accept a datasource with fields', () => {
    const result = DataSourceSchema.safeParse({
      type: 'json',
      fields: [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'active', type: 'boolean' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('should accept nested/recursive fields', () => {
    const result = DataSourceSchema.safeParse({
      type: 'json',
      fields: [
        {
          name: 'address',
          type: 'array',
          fields: [{ name: 'street', type: 'string' }],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid field type', () => {
    const result = DataSourceSchema.safeParse({
      type: 'json',
      fields: [{ name: 'x', type: 'xml' }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid datasource type', () => {
    const result = DataSourceSchema.safeParse({ type: 'csv' })
    expect(result.success).toBe(false)
  })
})
