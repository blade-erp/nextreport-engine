import { describe, it, expect } from 'vitest'
import { BandSchema, ReportSchema } from '../index.js'

const validPosition = { x: 0, y: 0, width: 200, height: 30 }

const validTextComponent = {
  type: 'text' as const,
  position: validPosition,
  content: 'Invoice',
}

const validTableComponent = {
  type: 'table' as const,
  position: validPosition,
  dataBinding: 'items',
  columns: [
    { header: 'Description', field: 'description' },
    { header: 'Amount', field: 'amount', width: 80 },
  ],
}

describe('BandSchema', () => {
  it('should accept a valid header band', () => {
    const result = BandSchema.safeParse({
      type: 'header',
      height: 60,
      components: [validTextComponent],
    })
    expect(result.success).toBe(true)
  })

  it('should accept a detail band with dataBinding', () => {
    const result = BandSchema.safeParse({
      type: 'detail',
      height: 100,
      dataBinding: 'items',
      iteratorName: 'item',
      components: [validTableComponent],
    })
    expect(result.success).toBe(true)
  })

  it('should accept all valid band types', () => {
    const types = [
      'header',
      'detail',
      'footer',
      'group-header',
      'group-footer',
      'page-header',
      'page-footer',
      'custom',
    ]
    for (const type of types) {
      const result = BandSchema.safeParse({ type, height: 50, components: [] })
      expect(result.success, `type '${type}' should be valid`).toBe(true)
    }
  })

  it('should accept a group-header band with groupBy', () => {
    const result = BandSchema.safeParse({
      type: 'group-header',
      height: 30,
      dataBinding: 'employees',
      groupBy: 'department',
      components: [validTextComponent],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.groupBy).toBe('department')
    }
  })

  it('should reject invalid band type', () => {
    const result = BandSchema.safeParse({ type: 'sidebar', height: 50, components: [] })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive height', () => {
    const result = BandSchema.safeParse({ type: 'header', height: 0, components: [] })
    expect(result.success).toBe(false)
  })

  it('should require components array', () => {
    const result = BandSchema.safeParse({ type: 'header', height: 50 })
    expect(result.success).toBe(false)
  })
})

describe('ReportSchema', () => {
  const validDataSource = {
    type: 'json' as const,
    fields: [{ name: 'id', type: 'number' as const }],
  }

  it('should accept a complete invoice report schema', () => {
    const result = ReportSchema.safeParse({
      type: 'report',
      dataSource: validDataSource,
      bands: [
        {
          type: 'header',
          height: 80,
          components: [validTextComponent],
        },
        {
          type: 'detail',
          height: 200,
          dataBinding: 'items',
          components: [validTableComponent],
        },
        {
          type: 'footer',
          height: 60,
          components: [],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('should apply defaults (version 1.0, locale en-US, A4 portrait)', () => {
    const result = ReportSchema.safeParse({
      type: 'report',
      dataSource: { type: 'json' },
      bands: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.version).toBe('1.0')
      expect(result.data.locale).toBe('en-US')
      expect(result.data.page.size).toBe('A4')
      expect(result.data.page.orientation).toBe('portrait')
    }
  })

  it('should allow custom version and locale', () => {
    const result = ReportSchema.safeParse({
      version: '2.0',
      type: 'report',
      locale: 'tr-TR',
      dataSource: { type: 'json' },
      bands: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.version).toBe('2.0')
      expect(result.data.locale).toBe('tr-TR')
    }
  })

  it('should reject invalid type value', () => {
    const result = ReportSchema.safeParse({
      type: 'dashboard',
      dataSource: { type: 'json' },
      bands: [],
    })
    expect(result.success).toBe(false)
  })

  it('should require dataSource', () => {
    const result = ReportSchema.safeParse({
      type: 'report',
      bands: [],
    })
    expect(result.success).toBe(false)
  })
})
