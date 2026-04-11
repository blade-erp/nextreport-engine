import { zodToJsonSchema } from 'zod-to-json-schema'
import { ReportSchema } from './report.schema.js'

export function getReportJsonSchema() {
  return zodToJsonSchema(ReportSchema, { name: 'ReportSchema', $refStrategy: 'none' })
}
