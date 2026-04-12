import { describe, it, expect } from 'vitest'
import {
  TextComponentSchema,
  TableComponentSchema,
  ImageComponentSchema,
  BarcodeComponentSchema,
  ComponentSchema,
} from '../index.js'

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

  it('should parse an image component', () => {
    const result = ComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
      src: 'https://example.com/logo.png',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('image')
    }
  })

  it('should reject an unknown component type', () => {
    const result = ComponentSchema.safeParse({
      type: 'chart',
      position: validPosition,
    })
    expect(result.success).toBe(false)
  })
})

describe('ImageComponentSchema', () => {
  it('should accept a valid image with URL', () => {
    const result = ImageComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
      src: 'https://example.com/logo.png',
    })
    expect(result.success).toBe(true)
  })

  it('should accept a base64 image', () => {
    const result = ImageComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
      src: 'data:image/png;base64,iVBORw0KGgo=',
    })
    expect(result.success).toBe(true)
  })

  it('should apply defaults for optional fields', () => {
    const result = ImageComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
      src: 'https://example.com/logo.png',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.alt).toBe('')
      expect(result.data.objectFit).toBe('contain')
    }
  })

  it('should accept custom objectFit', () => {
    const result = ImageComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
      src: 'https://example.com/logo.png',
      objectFit: 'cover',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.objectFit).toBe('cover')
    }
  })

  it('should reject invalid objectFit', () => {
    const result = ImageComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
      src: 'https://example.com/logo.png',
      objectFit: 'stretch',
    })
    expect(result.success).toBe(false)
  })

  it('should require src', () => {
    const result = ImageComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
    })
    expect(result.success).toBe(false)
  })

  it('should accept expression in src', () => {
    const result = ImageComponentSchema.safeParse({
      type: 'image',
      position: validPosition,
      src: '{{companyLogo}}',
    })
    expect(result.success).toBe(true)
  })
})

describe('BarcodeComponentSchema', () => {
  it('should accept a valid QR code component', () => {
    const result = BarcodeComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
      value: 'https://example.com',
    })
    expect(result.success).toBe(true)
  })

  it('should apply defaults for optional fields', () => {
    const result = BarcodeComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
      value: 'ABC-123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.format).toBe('qr')
      expect(result.data.color).toBe('#000000')
      expect(result.data.backgroundColor).toBe('#ffffff')
    }
  })

  it('should accept code128 format', () => {
    const result = BarcodeComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
      value: 'INV-2026-001',
      format: 'code128',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.format).toBe('code128')
    }
  })

  it('should reject invalid format', () => {
    const result = BarcodeComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
      value: 'test',
      format: 'ean13',
    })
    expect(result.success).toBe(false)
  })

  it('should require value', () => {
    const result = BarcodeComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
    })
    expect(result.success).toBe(false)
  })

  it('should accept expression in value', () => {
    const result = BarcodeComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
      value: '{{orderId}}',
      format: 'qr',
    })
    expect(result.success).toBe(true)
  })

  it('should accept custom colors', () => {
    const result = BarcodeComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
      value: 'test',
      color: '#333333',
      backgroundColor: '#f0f0f0',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.color).toBe('#333333')
      expect(result.data.backgroundColor).toBe('#f0f0f0')
    }
  })
})

describe('ComponentSchema (barcode in union)', () => {
  it('should parse a barcode component', () => {
    const result = ComponentSchema.safeParse({
      type: 'barcode',
      position: validPosition,
      value: 'hello',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('barcode')
    }
  })
})
