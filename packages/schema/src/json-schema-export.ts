import { toJSONSchema } from 'zod'
import { ReportSchema } from './report.schema.js'

export function getReportJsonSchema() {
  return toJSONSchema(ReportSchema)
}
