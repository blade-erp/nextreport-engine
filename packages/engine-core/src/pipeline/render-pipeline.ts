import { ReportSchema, type Report } from '@nextreport/schema'
import { processBands } from '../band-processor/band-processor.js'
import { calculateLayout } from '../layout/layout-calculator.js'
import type { RenderResult, RenderOptions } from '../types.js'

export interface ValidationResult {
  valid: boolean
  errors: Array<{ path: string; message: string }>
  warnings: string[]
}

export function renderReport(
  schema: Report,
  data: Record<string, unknown>,
  options?: RenderOptions,
): RenderResult {
  const locale = options?.locale ?? schema.locale ?? 'en-US'
  const parsed = ReportSchema.parse(schema)
  const processedBands = processBands(parsed.bands, data, locale)
  const pages = calculateLayout(processedBands, parsed.page)
  return {
    pages,
    metadata: {
      totalPages: pages.length,
      generatedAt: new Date().toISOString(),
      locale,
    },
  }
}

export function validateReport(schema: unknown): ValidationResult {
  const result = ReportSchema.safeParse(schema)
  if (result.success) {
    return { valid: true, errors: [], warnings: [] }
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    })),
    warnings: [],
  }
}
