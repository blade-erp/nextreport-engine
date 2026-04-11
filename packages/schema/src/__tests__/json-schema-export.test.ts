import { describe, it, expect } from 'vitest'
import { getReportJsonSchema } from '../index.js'

describe('getReportJsonSchema', () => {
  it('should return a valid JSON-serializable object', () => {
    const schema = getReportJsonSchema()
    expect(() => JSON.stringify(schema)).not.toThrow()
  })

  it('should include a definitions or properties key', () => {
    const schema = getReportJsonSchema()
    const str = JSON.stringify(schema)
    expect(str).toBeTruthy()
    expect(typeof schema).toBe('object')
    expect(schema).not.toBeNull()
  })

  it('should reference ReportSchema by name', () => {
    const schema = getReportJsonSchema()
    const serialized = JSON.stringify(schema)
    expect(serialized).toContain('ReportSchema')
  })

  it('should contain expected report fields', () => {
    const schema = getReportJsonSchema()
    const serialized = JSON.stringify(schema)
    expect(serialized).toContain('version')
    expect(serialized).toContain('bands')
    expect(serialized).toContain('dataSource')
  })
})
