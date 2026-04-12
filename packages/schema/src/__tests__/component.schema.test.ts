import { describe, it, expect } from 'vitest'
import { TextComponentSchema, TableComponentSchema, ComponentSchema } from '../index.js'

const validPosition = { x: 0, y: 0, width: 100, height: 50 }

describe('TextComponentSchema', () => {
  it('should accept a valid text component', () => {
    const result = TextComponentSchema.safeParse({
      type: 'text',
      position: validPosition,
      content: 'Hello, World!',
    })
    expect(result.success).toBe(true)
  })

  it('should apply defaults for optional fields', () => {
    const result = TextComponentSchema.safeParse({
      type: 'text',
      position: validPosition,
      content: 'Test',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fontSize).toBe(12)
      expect(result.data.fontWeight).toBe('normal')
      expect(result.data.color).toBe('#000000')
      expect(result.data.textAlign).toBe('left')
    }
  })

  it('should accept custom font and alignment options', () => {
    const result = TextComponentSchema.safeParse({
      type: 'text',
      position: validPosition,
      content: 'Bold center',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ff0000',
      textAlign: 'center',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid fontWeight', () => {
    const result = TextComponentSchema.safeParse({
      type: 'text',
      position: validPosition,
      content: 'test',
      fontWeight: 'italic',
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-positive fontSize', () => {
    const result = TextComponentSchema.safeParse({
      type: 'text',
      position: validPosition,
      content: 'test',
      fontSize: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid textAlign', () => {
    const result = TextComponentSchema.safeParse({
      type: 'text',
      position: validPosition,
      content: 'test',
      textAlign: 'justify',
    })
    expect(result.success).toBe(false)
  })
})

describe('TableComponentSchema', () => {
  it('should accept a valid table component', () => {
    const result = TableComponentSchema.safeParse({
      type: 'table',
      position: validPosition,
      dataBinding: 'items',
      columns: [
        { header: 'Name', field: 'name' },
        { header: 'Price', field: 'price', width: 80 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('should accept columns without optional width', () => {
    const result = TableComponentSchema.safeParse({
      type: 'table',
      position: validPosition,
      dataBinding: 'orders',
      columns: [{ header: 'ID', field: 'id' }],
    })
    expect(result.success).toBe(true)
  })

  it('should require dataBinding', () => {
    const result = TableComponentSchema.safeParse({
      type: 'table',
      position: validPosition,
      columns: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('ComponentSchema (discriminated union)', () => {
  it('should parse a text component', () => {
    const result = ComponentSchema.safeParse({
      type: 'text',
      position: validPosition,
      content: 'Hello',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('text')
    }
  })

  it('should parse a table component', () => {
    const result = ComponentSchema.safeParse({
      type: 'table',
      position: validPosition,
      dataBinding: 'rows',
      columns: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('table')
    }
  })

  it('should reject an unknown component type', () => {
    const result = ComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
    })
    expect(result.success).toBe(false)
  })
})
